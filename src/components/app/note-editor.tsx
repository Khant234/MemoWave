
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
import { type Note, type NoteVersion } from "@/lib/types";
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
  History
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
import { AudioTranscriber } from "./audio-transcriber";
import { AudioRecorder } from "./audio-recorder";
import { extractChecklistItems } from "@/ai/flows/extract-checklist-items";
import { NoteVersionHistory } from "./note-version-history";

type NoteEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onSave: (note: Note) => void;
};

// Define a type for our draft for clarity
type NoteDraft = Partial<Omit<Note, 'id' | 'isPinned' | 'isArchived' | 'isTrashed' | 'createdAt' | 'updatedAt'>>;


export function NoteEditor({
  isOpen,
  setIsOpen,
  note,
  onSave,
}: NoteEditorProps) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [color, setColor] = React.useState(NOTE_COLORS[0]);
  const [checklist, setChecklist] = React.useState<{ id: string; text: string; completed: boolean }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = React.useState("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [isTranscriberOpen, setIsTranscriberOpen] = React.useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState<string | undefined>();
  const [generatedAudio, setGeneratedAudio] = React.useState<string | null>(null);
  const [isDirty, setIsDirty] = React.useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = React.useState(false);

  const isSavingRef = React.useRef(false);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const getDrafts = (): Record<string, NoteDraft> => {
    if (typeof window === 'undefined') return {};
    const draftsRaw = localStorage.getItem('noteDrafts');
    try {
        return draftsRaw ? JSON.parse(draftsRaw) : {};
    } catch {
        return {};
    }
  };

  const saveDraft = React.useCallback((draftData: NoteDraft) => {
    if (typeof window === 'undefined') return;
    const draftId = note ? note.id : 'new';
    const drafts = getDrafts();
    drafts[draftId] = draftData;
    localStorage.setItem('noteDrafts', JSON.stringify(drafts));
  }, [note]);

  const clearDraft = React.useCallback(() => {
    if (typeof window === 'undefined') return;
    const draftId = note ? note.id : 'new';
    const drafts = getDrafts();
    delete drafts[draftId];
    localStorage.setItem('noteDrafts', JSON.stringify(drafts));
  }, [note]);

  const loadStateFromData = (data: Note | NoteDraft) => {
    setTitle(data.title || '');
    setContent(data.content || '');
    setTags(data.tags || []);
    setColor(data.color || NOTE_COLORS[0]);
    setChecklist(data.checklist || []);
    setImageUrl(data.imageUrl);
    setGeneratedAudio('audioUrl' in data ? data.audioUrl || null : null);
  };

  React.useEffect(() => {
    if (isOpen) {
      const drafts = getDrafts();
      const draftId = note ? note.id : 'new';
      const draft = drafts[draftId];

      if (draft) {
        loadStateFromData(draft);
      } else if (note) {
        loadStateFromData(note);
      } else {
        // Reset for a truly new note
        setTitle('');
        setContent('');
        setTags([]);
        setColor(NOTE_COLORS[0]);
        setChecklist([]);
        setImageUrl(undefined);
        setGeneratedAudio(null);
      }
    }
  }, [note, isOpen]);

  // Effect to save draft to local storage on any change
  React.useEffect(() => {
    if (isOpen) {
      const draftNote: NoteDraft = {
        title,
        content,
        tags,
        color,
        checklist,
        imageUrl,
        audioUrl: generatedAudio,
      };
      saveDraft(draftNote);
    }
  }, [isOpen, title, content, tags, color, checklist, imageUrl, generatedAudio, saveDraft]);

  // Effect to check if the form is "dirty" (has unsaved changes)
  React.useEffect(() => {
    if (!isOpen) {
      setIsDirty(false);
      return;
    }
  
    const currentState = {
      title: title,
      content: content,
      tags: tags,
      color: color,
      checklist: checklist,
      imageUrl: imageUrl,
      audioUrl: generatedAudio || undefined,
    };
  
    if (note) { // Editing an existing note
      const noteState = {
        title: note.title,
        content: note.content,
        tags: note.tags,
        color: note.color,
        checklist: note.checklist,
        imageUrl: note.imageUrl,
        audioUrl: note.audioUrl,
      };
      setIsDirty(JSON.stringify(currentState) !== JSON.stringify(noteState));
    } else { // Creating a new note
      const isEmpty = !title && !content && tags.length === 0 && checklist.length === 0 && !imageUrl && !generatedAudio;
      setIsDirty(!isEmpty);
    }
  }, [isOpen, note, title, content, tags, color, checklist, imageUrl, generatedAudio]);

  const handleSave = () => {
    if (!title && !content) {
      toast({
        title: 'Empty Note',
        description: 'Please add a title or some content to your note.',
        variant: 'destructive',
      });
      return;
    }

    isSavingRef.current = true;
    const newNote: Note = {
      id: note?.id || new Date().toISOString(),
      title,
      content,
      tags,
      color,
      isPinned: note?.isPinned || false,
      isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist,
      history: note?.history || [],
      isDraft: false,
    };

    if (imageUrl) {
      newNote.imageUrl = imageUrl;
    }
    if (generatedAudio) {
      newNote.audioUrl = generatedAudio;
    }

    onSave(newNote);
    clearDraft();
  };
  
  const handleDiscardChanges = () => {
    if (note) {
      loadStateFromData(note);
      clearDraft();
      toast({ title: "Changes discarded", description: "Your changes have been discarded." });
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && isDirty && !isSavingRef.current) {
        setIsCloseConfirmOpen(true);
    } else {
        isSavingRef.current = false; // Reset ref
        setIsOpen(open);
    }
  };

  const handleSaveAsDraftAndClose = () => {
    isSavingRef.current = true;
    const draftNote: Note = {
      id: note?.id || new Date().toISOString(),
      title,
      content,
      tags,
      color,
      isPinned: note?.isPinned || false,
      isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false,
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklist,
      history: note?.history || [],
      isDraft: true,
    };

    if (imageUrl) {
      draftNote.imageUrl = imageUrl;
    }
    if (generatedAudio) {
      draftNote.audioUrl = generatedAudio;
    }
    
    onSave(draftNote);
    
    clearDraft();
    setIsCloseConfirmOpen(false);
    setIsOpen(false);
  };

  const handleDiscardAndClose = () => {
    clearDraft();
    setIsCloseConfirmOpen(false);
    setIsOpen(false);
  };

  const handleTagAdd = () => {
    if (tagInput && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
    }
    setTagInput("");
  };

  const handleTagRemove = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };
  
  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([
        ...checklist,
        { id: new Date().toISOString(), text: newChecklistItem.trim(), completed: false },
      ]);
      setNewChecklistItem("");
    }
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const runAiAction = async (action: () => Promise<boolean | void>, messages: {loading: string, success: string, error: string}) => {
    setIsAiLoading(true);
    try {
        const shouldToast = await action();
        if (shouldToast !== false) {
          toast({ title: messages.success });
        }
    } catch(error: any) {
        console.error(error);
        toast({ title: "AI Error", description: error.message || messages.error, variant: "destructive"});
    }
    setIsAiLoading(false);
  }

  const handleSuggestTags = () => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to suggest tags.");
    const result = await suggestTags({ noteContent: content });
    if (result.tags) setTags(prev => [...new Set([...prev, ...result.tags])]);
  }, { loading: "Suggesting tags...", success: "Tags Suggested!", error: "Could not suggest tags." });
  
  const handleGenerateTitle = () => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate a title.");
    const result = await generateTitle({ noteContent: content });
    if (result.title) setTitle(result.title);
  }, { loading: "Generating title...", success: "Title Generated!", error: "Could not generate title." });
  
  const handleSummarizeNote = () => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to summarize.");
    const result = await summarizeNote({ noteContent: content });
    if (result.summary) setContent(prev => `${prev}\n\n**Summary:**\n${result.summary}`);
  }, { loading: "Summarizing note...", success: "Note Summarized!", error: "Could not summarize note." });

  const handleAutoChecklist = () => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate a checklist.");
    const result = await extractChecklistItems({ noteContent: content });
    if (result.items && result.items.length > 0) {
        const newItems = result.items.map(item => ({...item, id: new Date().toISOString() + Math.random()}));
        
        let addedCount = 0;
        setChecklist(prev => {
            const existingTexts = new Set(prev.map(p => p.text.trim().toLowerCase()));
            const filteredNewItems = newItems.filter(newItem => !existingTexts.has(newItem.text.trim().toLowerCase()));
            addedCount = filteredNewItems.length;
            return [...prev, ...filteredNewItems];
        });
        
        if (addedCount > 0) {
             toast({ title: "Checklist items added!", description: `${addedCount} new item(s) were added.` });
        } else {
             toast({ title: "No new items found", description: "Your checklist is already up to date." });
        }

    } else {
        toast({ title: "No actionable items found", description: "The AI couldn't find any tasks in your note." });
    }
    return false;
  }, { loading: "Analyzing note...", success: "Analysis complete!", error: "Could not generate checklist." });


  const handleGenerateAudio = () => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate audio.");
    const result = await burmeseTextToVoice(content);
    if(result.media) setGeneratedAudio(result.media);
  }, { loading: "Generating audio...", success: "Audio Generated!", error: "Could not generate audio." });

  const handleTranscriptionComplete = (text: string) => {
    setContent(prev => `${prev}\n\n${text}`.trim());
  };

  const handleAttachImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
        toast({ title: "Image Attached", description: "Your image has been added to the note." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAttachAudio = () => {
    audioInputRef.current?.click();
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGeneratedAudio(reader.result as string);
        toast({ title: "Audio Attached", description: "Your audio file has been added to the note." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveRecording = (blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      setGeneratedAudio(reader.result as string);
      toast({ title: "Audio Attached", description: "Your recording has been added to the note." });
    };
  };

  const handleRestoreVersion = (version: NoteVersion) => {
    setTitle(version.title);
    setContent(version.content);
    toast({
        title: "Version Restored",
        description: "The note content has been updated to the selected version.",
    });
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <input
          type="file"
          ref={imageInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={audioInputRef}
          onChange={handleAudioUpload}
          accept="audio/*"
          className="hidden"
        />
        <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0" style={{ borderLeft: `4px solid ${color}`}}>
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
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note title"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleGenerateTitle} disabled={isAiLoading || !content}>
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate Title with AI</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start weaving your thoughts..."
                  className="min-h-[200px]"
                />
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
                            <TooltipContent>
                                <p>Remove Image</p>
                            </TooltipContent>
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
                      {checklist.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                              <input type="checkbox" checked={item.completed} onChange={() => handleToggleChecklistItem(item.id)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveChecklistItem(item.id)}>
                                      <Trash2 className="h-4 w-4 text-destructive"/>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Remove Item</p>
                                </TooltipContent>
                              </Tooltip>
                          </div>
                      ))}
                  </div>
                  <div className="flex gap-2">
                      <Input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Add a checklist item" onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()} />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button onClick={handleAddChecklistItem}><Plus className="h-4 w-4" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add Item</p>
                        </TooltipContent>
                      </Tooltip>
                  </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleTagAdd()}
                    placeholder="Add a tag and press Enter"
                  />
                  <Button onClick={handleTagAdd}>Add</Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={handleSuggestTags} disabled={isAiLoading || !content}>
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Suggest Tags with AI</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleTagRemove(tag)}
                            className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Remove Tag</p>
                        </TooltipContent>
                      </Tooltip>
                    </Badge>
                  ))}
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
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleSummarizeNote}><BotMessageSquare className="mr-2 h-4 w-4"/>Summarize</Button>
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleAutoChecklist}><ListTodo className="mr-2 h-4 w-4"/>Auto Checklist</Button>
                  <Button variant="outline" disabled={!note} onClick={() => setIsHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>History</Button>
                  <Button variant="outline" onClick={handleAttachImage}><Paperclip className="mr-2 h-4 w-4"/>Attach Image</Button>
                  <Button variant="outline" onClick={() => setIsRecorderOpen(true)}><Mic className="mr-2 h-4 w-4"/>Record Audio</Button>
                  <Button variant="outline" onClick={handleAttachAudio}><Upload className="mr-2 h-4 w-4"/>Upload Audio</Button>
                  <Button variant="outline" onClick={() => setIsTranscriberOpen(true)}><BookText className="mr-2 h-4 w-4" />Transcribe (BU)</Button>
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleGenerateAudio}><Volume2 className="mr-2 h-4 w-4"/>Listen (BU)</Button>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 bg-background border-t flex items-center gap-2">
            <div className="mr-auto">
              {isDirty && note && (
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDiscardChanges}>
                  Discard Changes
                </Button>
              )}
            </div>
            
            <span className="text-sm text-muted-foreground">
              {isAiLoading
                ? "AI is working..."
                : isDirty
                ? "Unsaved changes"
                : note
                ? "All changes saved"
                : ""}
            </span>
    
            <SheetClose asChild>
              <Button variant="outline">Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={isAiLoading || !isDirty}>
              Save Note
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <AlertDialog open={isCloseConfirmOpen} onOpenChange={setIsCloseConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              Would you like to save your work as a draft, or discard the changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDiscardAndClose}>
              Discard Changes
            </Button>
            <Button onClick={handleSaveAsDraftAndClose}>
              Save as Draft
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AudioTranscriber 
        open={isTranscriberOpen}
        setOpen={setIsTranscriberOpen}
        onTranscriptionComplete={handleTranscriptionComplete}
      />
      <AudioRecorder
        open={isRecorderOpen}
        setOpen={setIsRecorderOpen}
        onSave={handleSaveRecording}
      />
      <NoteVersionHistory
        open={isHistoryOpen}
        setOpen={setIsHistoryOpen}
        history={note?.history || []}
        onRestore={handleRestoreVersion}
      />
    </>
  );
}
