

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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { type Note, type NoteVersion, type NoteStatus, type NotePriority, type NoteCategory, type NoteTemplate } from "@/lib/types";
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
  ScanText,
  BookCopy,
  PenLine,
  Palette,
  Wand2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateTitle } from "@/ai/flows/title-generation";
import { summarizeNote } from "@/ai/flows/note-summarization";
import { burmeseTextToVoice } from "@/ai/flows/burmese-text-to-voice";
import { translateNote } from "@/ai/flows/translate-note";
import { extractChecklistItems } from "@/ai/flows/extract-checklist-items";
import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import { completeText } from "@/ai/flows/complete-text";
import { DatePicker } from "../ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { KANBAN_COLUMN_TITLES, NOTE_PRIORITY_TITLES, NOTE_CATEGORIES, NOTE_CATEGORY_TITLES } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { useTemplates } from "@/contexts/templates-context";

// Lazy load dialogs
const AudioTranscriber = React.lazy(() => import('./audio-transcriber').then(module => ({ default: module.AudioTranscriber })));
const AudioRecorder = React.lazy(() => import('./audio-recorder').then(module => ({ default: module.AudioRecorder })));
const NoteVersionHistory = React.lazy(() => import('./note-version-history').then(module => ({ default: module.NoteVersionHistory })));
const HandwritingInput = React.lazy(() => import('./handwriting-input').then(module => ({ default: module.HandwritingInput })));
const SketchInput = React.lazy(() => import('./sketch-input').then(module => ({ default: module.SketchInput })));


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
  const [color, setColor] = React.useState(NOTE_COLORS[0]);
  const [checklist, setChecklist] = React.useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = React.useState("");
  const [editingChecklistItemId, setEditingChecklistItemId] = React.useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = React.useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isHandwritingOpen, setIsHandwritingOpen] = React.useState(false);
  const [isSketcherOpen, setIsSketcherOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>();
  const [generatedAudio, setGeneratedAudio] = React.useState<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = React.useState(false);
  const [ignoredChecklistItems, setIgnoredChecklistItems] = React.useState(new Set<string>());
  const [templateToApply, setTemplateToApply] = React.useState<NoteTemplate | null>(null);
  const { templates } = useTemplates();
  const [suggestion, setSuggestion] = React.useState<string | null>(null);

  const [status, setStatus] = React.useState<NoteStatus>('todo');
  const [priority, setPriority] = React.useState<NotePriority>('none');
  const [category, setCategory] = React.useState<NoteCategory>('uncategorized');
  const [dueDate, setDueDate] = React.useState<Date | null | undefined>(null);
  const [startTime, setStartTime] = React.useState<string | null>(null);
  const [endTime, setEndTime] = React.useState<string | null>(null);
  const [showOnBoard, setShowOnBoard] = React.useState(false);
  const [isKanbanConfirmOpen, setIsKanbanConfirmOpen] = React.useState(false);
  const prevChecklistLength = React.useRef(0);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const autoChecklistRunning = React.useRef(false);
  const bgTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fgTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();

  const timeOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour24 = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        const value = `${hour24}:${minute}`;

        const ampm = h >= 12 ? 'PM' : 'AM';
        let hour12 = h % 12;
        if (hour12 === 0) hour12 = 12;
        
        const label = `${hour12}:${minute} ${ampm}`;
        options.push({ value, label });
      }
    }
    return options;
  }, []);

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
    setColor(data.color || NOTE_COLORS[0]);
    setChecklist(data.checklist || []);
    setImageUrl(data.imageUrl);
    setGeneratedAudio('audioUrl' in data ? data.audioUrl || null : null);
    setStatus(data.status || 'todo');
    setPriority(data.priority || 'none');
    setCategory(data.category || 'uncategorized');
    setDueDate(data.dueDate ? new Date(data.dueDate) : null);
    setStartTime(data.startTime || null);
    setEndTime(data.endTime || null);
    setShowOnBoard(data.showOnBoard || false);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      const drafts = getDrafts();
      const draftId = note ? note.id : 'new';
      const draft = drafts[draftId];
      
      setIgnoredChecklistItems(new Set());
      setSuggestion(null);

      if (draft) {
        loadStateFromData(draft);
      } else if (note) {
        loadStateFromData(note);
      } else {
        setTitle('');
        setContent('');
        setColor(NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)]);
        setChecklist([]);
        setImageUrl(undefined);
        setGeneratedAudio(null);
        setStatus('todo');
        setPriority('none');
        setCategory('uncategorized');
        setDueDate(null);
        setStartTime(null);
        setEndTime(null);
        setShowOnBoard(false);
      }
      
      const currentChecklist = (draft || note)?.checklist || [];
      prevChecklistLength.current = currentChecklist.length;
    }
  }, [note, isOpen, getDrafts, loadStateFromData]);

  React.useEffect(() => {
    if (isOpen) {
      const draftNote: NoteDraft = {
        title, content, color, checklist, imageUrl, 
        audioUrl: generatedAudio, status, priority, category,
        dueDate: dueDate ? dueDate.toISOString() : null, 
        startTime, endTime, showOnBoard,
      };
      saveDraft(draftNote);
    }
  }, [isOpen, title, content, color, checklist, imageUrl, generatedAudio, status, priority, category, dueDate, startTime, endTime, showOnBoard, saveDraft]);

  React.useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      return;
    }
  
    const currentState = {
      title, content, color, checklist, imageUrl,
      audioUrl: generatedAudio || undefined, status, priority,
      category,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      showOnBoard,
    };
  
    if (note) {
      const noteState = {
        title: note.title, content: note.content, color: note.color,
        checklist: note.checklist, imageUrl: note.imageUrl, audioUrl: note.audioUrl,
        status: note.status, priority: note.priority, category: note.category,
        dueDate: note.dueDate || undefined,
        startTime: note.startTime || undefined,
        endTime: note.endTime || undefined,
        showOnBoard: note.showOnBoard || false,
      };
      setIsDirty(JSON.stringify(currentState) !== JSON.stringify(noteState));
    } else {
      const isEmpty = !title && !content && checklist.length === 0 && !imageUrl && !generatedAudio && !showOnBoard && !dueDate;
      setIsDirty(!isEmpty);
    }
  }, [isOpen, note, title, content, color, checklist, imageUrl, generatedAudio, status, priority, category, dueDate, startTime, endTime, showOnBoard]);

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

  React.useEffect(() => {
    if (!dueDate) {
        setStartTime(null);
        setEndTime(null);
    }
  }, [dueDate]);

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
      id: note?.id || new Date().toISOString(), title, content, color,
      isPinned: note?.isPinned || false, isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false, createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), checklist, history: note?.history || [],
      isDraft: false, status, priority, category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      startTime: dueDate ? startTime : null,
      endTime: dueDate ? endTime : null,
      showOnBoard, order: note?.order || Date.now(),
    };
    if (imageUrl) newNote.imageUrl = imageUrl;
    if (generatedAudio) newNote.audioUrl = generatedAudio;

    onSave(newNote);
  }, [title, content, color, checklist, imageUrl, generatedAudio, status, priority, category, dueDate, startTime, endTime, showOnBoard, note, onSave, toast]);
  
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
      id: note?.id || new Date().toISOString(), title, content, color,
      isPinned: note?.isPinned || false, isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false, createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), checklist, history: note?.history || [],
      isDraft: true, status, priority, category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      startTime: dueDate ? startTime : null,
      endTime: dueDate ? endTime : null,
      showOnBoard, order: note?.order || Date.now(),
    };
    if (imageUrl) draftNote.imageUrl = imageUrl;
    if (generatedAudio) draftNote.audioUrl = generatedAudio;
    
    onSave(draftNote);
    setIsCloseConfirmOpen(false);
  }, [title, content, color, checklist, imageUrl, generatedAudio, status, priority, category, dueDate, startTime, endTime, showOnBoard, note, onSave]);

  const handleDiscardAndClose = React.useCallback(() => {
    clearDraft();
    setIsCloseConfirmOpen(false);
    setIsOpen(false);
  }, [clearDraft, setIsOpen]);
  
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

  const handleRequestCompletion = React.useCallback(async () => {
    if (isAiLoading || !content.trim()) return;

    setIsAiLoading(true);
    setSuggestion(null);

    try {
        const result = await completeText({ currentText: content });
        if (result.completion) {
            setSuggestion(result.completion);
        }
    } catch (error: any) {
        toast({ title: "AI Completion Error", description: error.message || "Could not generate completion.", variant: "destructive" });
    } finally {
        setIsAiLoading(false);
    }
  }, [isAiLoading, content, toast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault(); // Prevent default tab behavior (focus change/indent)
      if (suggestion) {
        // If there's a suggestion, Tab accepts it
        setContent(currentContent => currentContent + suggestion);
        setSuggestion(null);
      } else if (content.trim()) {
        // If no suggestion, Tab requests one
        handleRequestCompletion();
      }
    }
  };


  const handleExtractText = React.useCallback(() => runAiAction(async () => {
    if(!imageUrl) throw new Error("Please attach an image first.");
    const result = await extractTextFromImage({ imageDataUri: imageUrl });
    if (result.extractedText && result.extractedText.trim()) {
      setContent(prev => `${prev}\n\n--- Extracted Text ---\n${result.extractedText}`.trim());
    } else {
      toast({
          title: "No Text Found",
          description: "The AI could not find any text in the image.",
      });
      return false; // prevent success toast
    }
  }, { success: "Text Extracted!", error: "Could not extract text from the image." }), [imageUrl, content, runAiAction, toast]);

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
    setContent(prev => [prev, text].filter(Boolean).join('\n\n'));
  }, []);
  
  const handleHandwritingComplete = React.useCallback((text: string) => {
    setContent(prev => [prev, text].filter(Boolean).join('\n'));
  }, []);

  const handleSaveSketch = React.useCallback((dataUrl: string) => {
    setImageUrl(dataUrl);
    toast({ title: "Sketch Attached" });
  }, [toast]);

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

  const applyTemplate = (template: NoteTemplate) => {
    const today = new Date().toLocaleDateString();
    if (template.title) {
        setTitle(template.title.replace(/\[Date\]/g, today));
    }
    setContent(template.content);
    if (template.checklist) {
        setChecklist(template.checklist.map(item => ({ ...item, id: new Date().toISOString() + Math.random(), completed: false })));
    }
    if (template.category) {
        setCategory(template.category);
    }
    toast({
        title: "Template Applied",
        description: `The "${template.name}" template has been applied.`,
    });
    setTemplateToApply(null);
  };

  const handleSelectTemplate = (template: NoteTemplate) => {
      if (title || content || checklist.length > 0) {
          setTemplateToApply(template);
      } else {
          applyTemplate(template);
      }
  };

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
                <div className="relative grid">
                    <Textarea
                        ref={bgTextareaRef}
                        readOnly
                        className="col-start-1 row-start-1 resize-none whitespace-pre-wrap text-muted-foreground [caret-color:transparent] min-h-[200px]"
                        value={suggestion ? content + suggestion : content}
                        tabIndex={-1}
                    />
                    <Textarea
                        ref={fgTextareaRef}
                        id="content"
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            if (suggestion) {
                                setSuggestion(null);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        onScroll={() => {
                            if (bgTextareaRef.current && fgTextareaRef.current) {
                                bgTextareaRef.current.scrollTop = fgTextareaRef.current.scrollTop;
                                bgTextareaRef.current.scrollLeft = fgTextareaRef.current.scrollLeft;
                            }
                        }}
                        placeholder="Start weaving your thoughts... (Press Tab for AI completion)"
                        className="col-start-1 row-start-1 resize-none whitespace-pre-wrap bg-transparent text-foreground min-h-[200px]"
                    />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={cn(
                        "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                        color === c
                          ? "border-primary ring-2 ring-primary ring-offset-2"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Task Settings</Label>
                <div className="space-y-4 rounded-lg border p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                            <Label>Category</Label>
                            <Select value={category} onValueChange={(value: NoteCategory) => setCategory(value)}>
                                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                                <SelectContent>
                                    {NOTE_CATEGORIES.map((key) => (
                                        <SelectItem key={key} value={key}>{NOTE_CATEGORY_TITLES[key]}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div>
                        <Label>Date & Time</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                            <div className="sm:col-span-1">
                                <DatePicker date={dueDate} setDate={(d) => setDueDate(d)} />
                            </div>
                            <div className="sm:col-span-2 grid grid-cols-2 gap-2">
                                <Select value={startTime || ''} onValueChange={setStartTime} disabled={!dueDate}>
                                    <SelectTrigger><SelectValue placeholder="Start time" /></SelectTrigger>
                                    <SelectContent>
                                        {timeOptions.map(time => <SelectItem key={`start-${time.value}`} value={time.value}>{time.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={endTime || ''} onValueChange={setEndTime} disabled={!dueDate}>
                                    <SelectTrigger><SelectValue placeholder="End time" /></SelectTrigger>
                                    <SelectContent>
                                        {timeOptions.map(time => <SelectItem key={`end-${time.value}`} value={time.value}>{time.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
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
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={handleExtractText}
                        disabled={isAiLoading}
                    >
                        {isAiLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                        <ScanText className="mr-2 h-4 w-4" />
                        )}
                        Extract Text from Image (OCR)
                    </Button>
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
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline"><BookCopy className="mr-2 h-4 w-4"/>Templates</Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent><p>Apply a note template</p></TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent>
                      {templates.map(template => (
                        <DropdownMenuItem key={template.id} onSelect={() => handleSelectTemplate(template)}>
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleSummarizeNote}><BotMessageSquare className="mr-2 h-4 w-4"/>Summarize</Button>
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleRequestCompletion}><Wand2 className="mr-2 h-4 w-4"/>Complete</Button>
                  <Button variant="outline" disabled={!note} onClick={() => setIsHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>History</Button>
                  <Button variant="outline" onClick={() => setIsHandwritingOpen(true)}><PenLine className="mr-2 h-4 w-4"/>Write</Button>
                  <Button variant="outline" onClick={() => setIsSketcherOpen(true)}><Palette className="mr-2 h-4 w-4"/>Sketch</Button>
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
      <AlertDialog open={!!templateToApply} onOpenChange={(open) => !open && setTemplateToApply(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Apply Template?</AlertDialogTitle>
                <AlertDialogDescription>
                    Applying this template will replace the current content of your note. Are you sure you want to continue?
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setTemplateToApply(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => applyTemplate(templateToApply!)}>Apply</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <React.Suspense fallback={null}>
        {isTranscriberOpen && <AudioTranscriber open={isTranscriberOpen} setOpen={setIsTranscriberOpen} onTranscriptionComplete={handleTranscriptionComplete}/>}
        {isRecorderOpen && <AudioRecorder open={isRecorderOpen} setOpen={setIsRecorderOpen} onSave={handleSaveRecording}/>}
        {isHistoryOpen && <NoteVersionHistory open={isHistoryOpen} setOpen={setIsHistoryOpen} history={note?.history || []} onRestore={handleRestoreVersion}/>}
        {isHandwritingOpen && <HandwritingInput open={isHandwritingOpen} setOpen={setIsHandwritingOpen} onRecognitionComplete={handleHandwritingComplete} />}
        {isSketcherOpen && <SketchInput open={isSketcherOpen} setOpen={setIsSketcherOpen} onSave={handleSaveSketch}/>}
      </React.Suspense>
    </>
  );
}
