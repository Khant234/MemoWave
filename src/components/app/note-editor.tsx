

"use client";

import * as React from "react";
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { type Note, type NoteVersion, type NoteStatus, type NotePriority } from "@/lib/types";
import { NOTE_COLORS } from "@/lib/data";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Paperclip,
  Mic,
  Trash2,
  BotMessageSquare,
  BookText,
  X,
  Plus,
  Loader2,
  Volume2,
  Upload,
  ListTodo,
  History,
  Pencil,
  Languages,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { suggestTags } from "@/ai/flows/suggest-tags";
import { generateTitle } from "@/ai/flows/title-generation";
import { summarizeNote } from "@/ai/flows/note-summarization";
import { burmeseTextToVoice } from "@/ai/flows/burmese-text-to-voice";
import { translateNote } from "@/ai/flows/translate-note";
import { extractChecklistItems } from "@/ai/flows/extract-checklist-items";
import { DatePicker } from "../ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { KANBAN_COLUMN_TITLES, NOTE_PRIORITY_TITLES } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";

// Lazy load dialogs
const AudioTranscriber = React.lazy(() => import('./audio-transcriber').then(module => ({ default: module.AudioTranscriber })));
const AudioRecorder = React.lazy(() => import('./audio-recorder').then(module => ({ default: module.AudioRecorder })));
const NoteVersionHistory = React.lazy(() => import('./note-version-history').then(module => ({ default: module.NoteVersionHistory })));


type NoteEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onSave: (note: Note) => void;
  isSaving?: boolean;
};

type NoteDraft = Partial<Omit<Note, 'id' | 'isPinned' | 'isArchived' | 'isTrashed' | 'createdAt' | 'updatedAt'>>;

export function NoteEditor({
  isOpen,
  setIsOpen,
  note,
  onSave,
  isSaving = false,
}: NoteEditorProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [color, setColor] = React.useState(NOTE_COLORS[0]);
  const [checklist, setChecklist] = React.useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = React.useState("");
  const [editingChecklistItemId, setEditingChecklistItemId] = React.useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = React.useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>();
  const [generatedAudio, setGeneratedAudio] = React.useState<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = React.useState(false);
  const [ignoredChecklistItems, setIgnoredChecklistItems] = React.useState(new Set<string>());

  const [status, setStatus] = React.useState<NoteStatus>('todo');
  const [priority, setPriority] = React.useState<NotePriority>('none');
  const [dueDate, setDueDate] = React.useState<Date | null | undefined>(null);
  const [showOnBoard, setShowOnBoard] = React.useState(false);
  const [isKanbanConfirmOpen, setIsKanbanConfirmOpen] = React.useState(false);
  const prevChecklistLength = React.useRef(0);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const autoChecklistRunning = React.useRef(false);

  const { toast } = useToast();

  const getDrafts = React.useCallback((): Record<string, NoteDraft> => {
    if (typeof window === 'undefined') return {};
    const draftsRaw = localStorage.getItem('noteDrafts');
    try {
        return draftsRaw ? JSON.parse(draftsRaw) : {};
    } catch {
        return {};
    }
  }, []);

  const saveDraft = React.useCallback((draftData: NoteDraft) => {
    if (typeof window === 'undefined') return;
    const draftId = note ? note.id : 'new';
    const drafts = getDrafts();
    drafts[draftId] = draftData;
    localStorage.setItem('noteDrafts', JSON.stringify(drafts));
  }, [note, getDrafts]);

  const clearDraft = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const draftId = note ? note.id : 'new';
    const drafts = getDrafts();
    delete drafts[draftId];
    localStorage.setItem('noteDrafts', JSON.stringify(drafts));
  }, [note, getDrafts]);

  const loadStateFromData = React.useCallback((data: Note | NoteDraft) => {
    setTitle(data.title || '');
    setContent(data.content || '');
    setTags(data.tags || []);
    setColor(data.color || NOTE_COLORS[0]);
    setChecklist(data.checklist || []);
    setImageUrl(data.imageUrl);
    setGeneratedAudio('audioUrl' in data ? data.audioUrl || null : null);
    setStatus(data.status || 'todo');
    setPriority(data.priority || 'none');
    setDueDate(data.dueDate ? new Date(data.dueDate) : null);
    setShowOnBoard(data.showOnBoard || false);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const drafts = getDrafts();
      const draftId = note ? note.id : 'new';
      const draft = drafts[draftId];
      
      setIgnoredChecklistItems(new Set());

      if (draft) {
        loadStateFromData(draft);
      } else if (note) {
        loadStateFromData(note);
      } else {
        setTitle('');
        setContent('');
        setTags([]);
        setColor(NOTE_COLORS[0]);
        setChecklist([]);
        setImageUrl(undefined);
        setGeneratedAudio(null);
        setStatus('todo');
        setPriority('none');
        setDueDate(null);
        setShowOnBoard(false);
      }
      
      const currentChecklist = (draft || note)?.checklist || [];
      prevChecklistLength.current = currentChecklist.length;
    }
  }, [note, isOpen, getDrafts, loadStateFromData]);

  React.useEffect(() => {
    if (isOpen) {
      const draftNote: NoteDraft = {
        title, content, tags, color, checklist, imageUrl, 
        audioUrl: generatedAudio, status, priority, 
        dueDate: dueDate ? dueDate.toISOString() : null, showOnBoard,
      };
      saveDraft(draftNote);
    }
  }, [isOpen, title, content, tags, color, checklist, imageUrl, generatedAudio, status, priority, dueDate, showOnBoard, saveDraft]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      return;
    }
  
    const currentState = {
      title, content, tags, color, checklist, imageUrl,
      audioUrl: generatedAudio || undefined, status, priority,
      dueDate: dueDate ? dueDate.toISOString() : undefined, showOnBoard,
    };
  
    if (note) {
      const noteState = {
        title: note.title, content: note.content, tags: note.tags, color: note.color,
        checklist: note.checklist, imageUrl: note.imageUrl, audioUrl: note.audioUrl,
        status: note.status, priority: note.priority, dueDate: note.dueDate || undefined,
        showOnBoard: note.showOnBoard || false,
      };
      setIsDirty(JSON.stringify(currentState) !== JSON.stringify(noteState));
    } else {
      const isEmpty = !title && !content && tags.length === 0 && checklist.length === 0 && !imageUrl && !generatedAudio && !showOnBoard;
      setIsDirty(!isEmpty);
    }
  }, [isOpen, note, title, content, tags, color, checklist, imageUrl, generatedAudio, status, priority, dueDate, showOnBoard]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handler = setTimeout(async () => {
      if (!content.trim() || autoChecklistRunning.current || isAiLoading) return;
      
      autoChecklistRunning.current = true;
      try {
        const result = await extractChecklistItems({ noteContent: content });
        if (result.items && result.items.length > 0) {
          const newItems = result.items.map(item => ({...item, id: new Date().toISOString() + Math.random()}));
          
          let addedCount = 0;
          setChecklist(prev => {
            const existingTexts = new Set(prev.map(p => p.text.trim().toLowerCase()));
            const filteredNewItems = newItems.filter(newItem => 
                !existingTexts.has(newItem.text.trim().toLowerCase()) &&
                !ignoredChecklistItems.has(newItem.text.trim().toLowerCase())
            );
            addedCount = filteredNewItems.length;
            return filteredNewItems.length > 0 ? [...prev, ...filteredNewItems] : prev;
          });
          
          if (addedCount > 0) {
            toast({
              title: "Checklist Items Added",
              description: `AI automatically found ${addedCount} new checklist item(s).`,
            });
          }
        }
      } catch (error) {
        console.error("Auto checklist generation failed", error);
      } finally {
        autoChecklistRunning.current = false;
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [content, isOpen, toast, isAiLoading, ignoredChecklistItems]);

  React.useEffect(() => {
    if (isOpen) {
        if (checklist.length > 0 && prevChecklistLength.current === 0 && !showOnBoard) {
            setIsKanbanConfirmOpen(true);
        }
        prevChecklistLength.current = checklist.length;
    }
  }, [checklist.length, isOpen, showOnBoard]);

  const handleSave = React.useCallback(() => {
    if (!title && !content) {
      toast({
        title: 'Empty Note',
        description: 'Please add a title or some content to your note.',
        variant: 'destructive',
      });
      return;
    }

    const newNote: Note = {
      id: note?.id || new Date().toISOString(), title, content, tags, color,
      isPinned: note?.isPinned || false, isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false, createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), checklist, history: note?.history || [],
      isDraft: false, status, priority, dueDate: dueDate ? dueDate.toISOString() : null,
      showOnBoard, order: note?.order || Date.now(),
    };
    if (imageUrl) newNote.imageUrl = imageUrl;
    if (generatedAudio) newNote.audioUrl = generatedAudio;

    onSave(newNote);
  }, [title, content, tags, color, checklist, imageUrl, generatedAudio, status, priority, dueDate, showOnBoard, note, onSave, toast]);
  
  const handleDiscardChanges = React.useCallback(() => {
    if (note) {
      loadStateFromData(note);
      clearDraft();
      toast({ title: "Changes discarded", description: "Your changes have been discarded." });
    }
  }, [note, loadStateFromData, clearDraft, toast]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    if (!open && isDirty && !isSaving) {
        setIsCloseConfirmOpen(true);
    } else {
        setIsOpen(open);
    }
  }, [isDirty, isSaving, setIsOpen]);

  const handleSaveAsDraftAndClose = React.useCallback(() => {
    const draftNote: Note = {
      id: note?.id || new Date().toISOString(), title, content, tags, color,
      isPinned: note?.isPinned || false, isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false, createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), checklist, history: note?.history || [],
      isDraft: true, status, priority, dueDate: dueDate ? dueDate.toISOString() : null,
      showOnBoard, order: note?.order || Date.now(),
    };
    if (imageUrl) draftNote.imageUrl = imageUrl;
    if (generatedAudio) draftNote.audioUrl = generatedAudio;
    
    onSave(draftNote);
    setIsCloseConfirmOpen(false);
  }, [title, content, tags, color, checklist, imageUrl, generatedAudio, status, priority, dueDate, showOnBoard, note, onSave]);

  const handleDiscardAndClose = React.useCallback(() => {
    clearDraft();
    setIsCloseConfirmOpen(false);
    setIsOpen(false);
  }, [clearDraft, setIsOpen]);

  const handleTagAdd = React.useCallback(() => {
    if (tagInput && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput("");
  }, [tagInput, tags]);

  const handleTagRemove = React.useCallback((tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  }, [tags]);
  
  const handleAddChecklistItem = React.useCallback(() => {
    if (newChecklistItem.trim()) {
      setChecklist([ ...checklist, { id: new Date().toISOString(), text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem("");
    }
  }, [newChecklistItem, checklist]);

  const handleToggleChecklistItem = React.useCallback((id: string) => {
    setChecklist(checklist.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
  }, [checklist]);

  const handleUpdateChecklistItemText = React.useCallback((id: string, newText: string) => {
    if (newText.trim()) {
      setChecklist(checklist.map((item) => item.id === id ? { ...item, text: newText.trim() } : item));
    }
    setEditingChecklistItemId(null);
  }, [checklist]);

  const handleRemoveChecklistItem = React.useCallback((id: string) => {
    const itemToRemove = checklist.find((item) => item.id === id);
    if (itemToRemove) {
      setIgnoredChecklistItems(prev => new Set(prev).add(itemToRemove.text.trim().toLowerCase()));
    }
    setChecklist(checklist.filter((item) => item.id !== id));
  }, [checklist]);

  const runAiAction = React.useCallback(async (action: () => Promise<boolean | void>, messages: {success: string, error: string}) => {
    setIsAiLoading(true);
    try {
        const shouldToast = await action();
        if (shouldToast !== false) toast({ title: messages.success });
    } catch(error: any) {
        toast({ title: "AI Error", description: error.message || messages.error, variant: "destructive"});
    }
    setIsAiLoading(false);
  }, [toast]);

  const handleSuggestTags = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to suggest tags.");
    const result = await suggestTags({ noteContent: content });
    if (result.tags) setTags(prev => [...new Set([...prev, ...result.tags])]);
  }, { success: "Tags Suggested!", error: "Could not suggest tags." }), [content, runAiAction]);
  
  const handleGenerateTitle = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate a title.");
    const result = await generateTitle({ noteContent: content });
    if (result.title) setTitle(result.title);
  }, { success: "Title Generated!", error: "Could not generate title." }), [content, runAiAction]);
  
  const handleSummarizeNote = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to summarize.");
    const result = await summarizeNote({ noteContent: content });
    if (result.summary) setContent(prev => `${prev}\n\n**Summary:**\n${result.summary}`);
  }, { success: "Note Summarized!", error: "Could not summarize note." }), [content, runAiAction]);

  const handleGenerateAudio = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate audio.");
    const result = await burmeseTextToVoice(content);
    if(result.media) setGeneratedAudio(result.media);
  }, { success: "Audio Generated!", error: "Could not generate audio." }), [content, runAiAction]);

  const handleTranslate = React.useCallback(() => runAiAction(async () => {
    if (!content && checklist.length === 0) throw new Error("Please add content or checklist items to translate.");
    const result = await translateNote({
      noteContent: content,
      checklistItems: checklist.map(item => ({ id: item.id, text: item.text })),
      targetLanguage: "Burmese",
    });

    if (result.translatedContent) setContent(result.translatedContent);
    if (result.translatedChecklistItems && result.translatedChecklistItems.length > 0) {
      const translatedMap = new Map(result.translatedChecklistItems.map(item => [item.id, item.translatedText]));
      setChecklist(prev => prev.map(item => ({...item, text: translatedMap.get(item.id) || item.text})));
    }
  }, { success: "Note translated to Burmese!", error: "Could not translate note." }), [content, checklist, runAiAction]);

  const handleTranscriptionComplete = React.useCallback((text: string) => {
    setContent(prev => `${prev}\n\n${text}`.trim());
  }, []);

  const handleAttachImage = React.useCallback(() => imageInputRef.current?.click(), []);
  const handleImageUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast({ title: "Image Attached" });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleAttachAudio = React.useCallback(() => audioInputRef.current?.click(), []);
  const handleAudioUpload = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedAudio(reader.result as string);
        toast({ title: "Audio Attached" });
      };
      reader.readAsDataURL(file);
    }
  }, [toast]);

  const handleSaveRecording = React.useCallback((blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      setGeneratedAudio(reader.result as string);
      toast({ title: "Audio Attached" });
    };
  }, [toast]);

  const handleRestoreVersion = React.useCallback((version: NoteVersion) => {
    setTitle(version.title);
    setContent(version.content);
    toast({ title: "Version Restored" });
  }, [toast]);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden"/>
        <input type="file" ref={audioInputRef} onChange={handleAudioUpload} accept="audio/*" className="hidden"/>
        <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
          <SheetHeader className="p-6">
            <SheetTitle className="font-headline">
              {note ? "Edit Note" : "New Note"}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-grow px-6">
            <div className="space-y-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="flex gap-2">
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title"/>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleGenerateTitle} disabled={isAiLoading || !content}>
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Generate Title with AI</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Start weaving your thoughts..." className="min-h-[200px]"/>
              </div>

              <div className="space-y-4">
                <Label>Project Settings</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-lg border p-4">
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(value: NoteStatus) => setStatus(value)}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(KANBAN_COLUMN_TITLES).map(([key, title]) => (
                                    <SelectItem key={key} value={key}>{title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={priority} onValueChange={(value: NotePriority) => setPriority(value)}>
                            <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                            <SelectContent>
                                {Object.entries(NOTE_PRIORITY_TITLES).map(([key, title]) => (
                                    <SelectItem key={key} value={key}>{title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <DatePicker date={dueDate} setDate={(d) => setDueDate(d)} />
                    </div>
                    <div className="sm:col-span-3 flex items-center space-x-2 pt-2">
                      <Switch id="show-on-board" checked={showOnBoard} onCheckedChange={setShowOnBoard} />
                      <Label htmlFor="show-on-board" className="cursor-pointer">Show on Kanban Board</Label>
                    </div>
                </div>
              </div>
              
              {imageUrl && (
                <div className="space-y-2">
                    <Label>Attached Image</Label>
                    <div className="relative">
                        <Image width={600} height={400} src={imageUrl} alt="Note attachment" className="rounded-lg w-full h-auto" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setImageUrl(undefined)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Remove Image</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>
              )}

              {generatedAudio && (
                  <div className="space-y-2">
                      <Label>Attached Audio</Label>
                      <audio controls src={generatedAudio} className="w-full" />
                      <Button variant="destructive" size="sm" className="w-full" onClick={() => setGeneratedAudio(null)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Remove Audio
                      </Button>
                  </div>
              )}

              <div className="space-y-4 rounded-lg border p-4">
                  <Label>Checklist</Label>
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 group">
                        <input type="checkbox" checked={item.completed} onChange={() => handleToggleChecklistItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                        {editingChecklistItemId === item.id ? (
                          <Input defaultValue={item.text} autoFocus onBlur={(e) => handleUpdateChecklistItemText(item.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateChecklistItemText(item.id, e.currentTarget.value); if (e.key === 'Escape') setEditingChecklistItemId(null);}} className="h-8 flex-grow"/>
                        ) : (
                          <span className={cn("flex-grow cursor-pointer", item.completed && "line-through text-muted-foreground")} onDoubleClick={() => setEditingChecklistItemId(item.id)}>{item.text}</span>
                        )}
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingChecklistItemId(item.id)}><Pencil className="h-4 w-4 text-muted-foreground" /></Button></TooltipTrigger><TooltipContent><p>Edit Item</p></TooltipContent></Tooltip>
                          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveChecklistItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TooltipTrigger><TooltipContent><p>Remove Item</p></TooltipContent></Tooltip>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                      <Input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Add a checklist item" onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()} />
                      <Tooltip><TooltipTrigger asChild><Button onClick={handleAddChecklistItem}><Plus className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Add Item</p></TooltipContent></Tooltip>
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input id="tags" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTagAdd()} placeholder="Add a tag and press Enter"/>
                  <Button onClick={handleTagAdd}>Add</Button>
                  <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleSuggestTags} disabled={isAiLoading || !content}><Sparkles className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Suggest Tags with AI</p></TooltipContent></Tooltip>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}<Tooltip><TooltipTrigger asChild><button onClick={() => handleTagRemove(tag)} className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"><X className="h-3 w-3" /></button></TooltipTrigger><TooltipContent><p>Remove Tag</p></TooltipContent></Tooltip></Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={cn("h-8 w-8 rounded-full border-2 transition-transform hover:scale-110", color === c ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent")} style={{ backgroundColor: c }}/>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleSummarizeNote}><BotMessageSquare className="mr-2 h-4 w-4"/>Summarize</Button>
                  <Button variant="outline" disabled={!note} onClick={() => setIsHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>History</Button>
                  <Button variant="outline" onClick={handleAttachImage}><Paperclip className="mr-2 h-4 w-4"/>Attach Image</Button>
                  <Button variant="outline" onClick={() => setIsRecorderOpen(true)}><Mic className="mr-2 h-4 w-4"/>Record Audio</Button>
                  <Button variant="outline" onClick={handleAttachAudio}><Upload className="mr-2 h-4 w-4"/>Upload Audio</Button>
                  <Button variant="outline" onClick={() => setIsTranscriberOpen(true)}><BookText className="mr-2 h-4 w-4" />Transcribe Voice</Button>
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleGenerateAudio}><Volume2 className="mr-2 h-4 w-4"/>Listen (BU)</Button>
                  <Button variant="outline" disabled={isAiLoading || (!content && checklist.length === 0)} onClick={handleTranslate}><Languages className="mr-2 h-4 w-4"/>Translate to Burmese</Button>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 bg-background border-t flex items-center gap-2">
            <div className="mr-auto">
              {isDirty && note && (<Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDiscardChanges}>Discard Changes</Button>)}
            </div>
            <span className="text-sm text-muted-foreground">{isSaving ? "Saving..." : isAiLoading ? "AI is working..." : isDirty ? "Unsaved changes" : note ? "All changes saved" : ""}</span>
            <SheetClose asChild><Button variant="outline">Cancel</Button></SheetClose>
            <Button onClick={handleSave} disabled={isAiLoading || !isDirty || isSaving}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save Note"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={isCloseConfirmOpen} onOpenChange={setIsCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>You have unsaved changes</AlertDialogTitle><AlertDialogDescription>Would you like to save your work as a draft, or discard the changes?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep Editing</AlertDialogCancel><Button variant="destructive" onClick={handleDiscardAndClose}>Discard Changes</Button><Button onClick={handleSaveAsDraftAndClose}>Save as Draft</Button></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isKanbanConfirmOpen} onOpenChange={setIsKanbanConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Track Tasks on Kanban Board?</AlertDialogTitle><AlertDialogDescription>You've added checklist items. Would you like to add this note to the Kanban board to visualize and track your tasks?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>No, thanks</AlertDialogCancel><AlertDialogAction onClick={() => {setShowOnBoard(true); toast({title: "Added to Kanban", description: "This note will now appear on your board."})}}>Yes, Add to Board</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <React.Suspense fallback={null}>
        {isTranscriberOpen && <AudioTranscriber open={isTranscriberOpen} setOpen={setIsTranscriberOpen} onTranscriptionComplete={handleTranscriptionComplete}/>}
        {isRecorderOpen && <AudioRecorder open={isRecorderOpen} setOpen={setIsRecorderOpen} onSave={handleSaveRecording}/>}
        {isHistoryOpen && <NoteVersionHistory open={isHistoryOpen} setOpen={setIsHistoryOpen} history={note?.history || []} onRestore={handleRestoreVersion}/>}
      </React.Suspense>
    </>
  );
}
