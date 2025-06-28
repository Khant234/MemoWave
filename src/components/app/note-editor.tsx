
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { type Note } from "@/lib/types";
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
} from "lucide-react";
import { suggestTags } from "@/ai/flows/suggest-tags";
import { generateTitle } from "@/ai/flows/title-generation";
import { summarizeNote } from "@/ai/flows/note-summarization";
import { burmeseTextToVoice } from "@/ai/flows/burmese-text-to-voice";
import { AudioTranscriber } from "./audio-transcriber";
import { AudioRecorder } from "./audio-recorder";

type NoteEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onSave: (note: Note) => void;
};

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
  const [imageUrl, setImageUrl] = React.useState<string | undefined>();
  const [generatedAudio, setGeneratedAudio] = React.useState<string | null>(null);

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      if (note) {
        // We are editing an existing note
        setTitle(note.title);
        setContent(note.content);
        setTags(note.tags);
        setColor(note.color);
        setChecklist(note.checklist || []);
        setImageUrl(note.imageUrl);
        setGeneratedAudio(note.audioUrl || null);
      } else {
        // We are creating a new note, check for a draft in localStorage
        const savedDraftRaw = localStorage.getItem('noteDraft');
        if (savedDraftRaw) {
          try {
            const savedDraft = JSON.parse(savedDraftRaw);
            setTitle(savedDraft.title || '');
            setContent(savedDraft.content || '');
            setTags(savedDraft.tags || []);
            setColor(savedDraft.color || NOTE_COLORS[0]);
            setChecklist(savedDraft.checklist || []);
            setImageUrl(savedDraft.imageUrl);
            setGeneratedAudio(savedDraft.audioUrl || null);
          } catch (e) {
            console.error("Failed to parse note draft", e);
            // Reset if draft is corrupted
            setTitle('');
            setContent('');
            setTags([]);
            setColor(NOTE_COLORS[0]);
            setChecklist([]);
            setImageUrl(undefined);
            setGeneratedAudio(null);
          }
        } else {
          // No draft exists, start with a blank note
          setTitle('');
          setContent('');
          setTags([]);
          setColor(NOTE_COLORS[0]);
          setChecklist([]);
          setImageUrl(undefined);
          setGeneratedAudio(null);
        }
      }
    }
  }, [note, isOpen]);

  // This effect saves the current input as a draft for new notes.
  React.useEffect(() => {
    if (isOpen && !note) {
      const draftNote = {
        title,
        content,
        tags,
        color,
        checklist,
        imageUrl,
        audioUrl: generatedAudio,
      };
      localStorage.setItem('noteDraft', JSON.stringify(draftNote));
    }
  }, [isOpen, note, title, content, tags, color, checklist, imageUrl, generatedAudio]);


  const handleSave = () => {
    if (!title && !content) {
        toast({
            title: "Empty Note",
            description: "Please add a title or some content to your note.",
            variant: "destructive"
        })
        return;
    }

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
      imageUrl,
      audioUrl: generatedAudio || undefined,
    };
    onSave(newNote);
    
    // If it was a new note, clear the draft from localStorage
    if (!note) {
        localStorage.removeItem('noteDraft');
    }
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

  const runAiAction = async (action: () => Promise<void>, messages: {loading: string, success: string, error: string}) => {
    setIsAiLoading(true);
    try {
        await action();
        toast({ title: messages.success });
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

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // If we are closing a new note editor without saving, clear the draft.
      if (!note) {
        localStorage.removeItem('noteDraft');
      }
    }
    setIsOpen(open);
  };


  return (
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
      <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle className="font-headline">{note ? "Edit Note" : "New Note"}</SheetTitle>
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
                <Button variant="outline" size="icon" onClick={handleGenerateTitle} disabled={isAiLoading || !content}>
                  <Sparkles className="h-4 w-4" />
                </Button>
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
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8" onClick={() => setImageUrl(undefined)}>
                          <Trash2 className="h-4 w-4" />
                      </Button>
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
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveChecklistItem(item.id)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <Input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Add a checklist item" onKeyDown={e => e.key === 'Enter' && handleAddChecklistItem()} />
                    <Button onClick={handleAddChecklistItem}><Plus className="h-4 w-4" /></Button>
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
                <Button variant="outline" size="icon" onClick={handleSuggestTags} disabled={isAiLoading || !content}>
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      onClick={() => handleTagRemove(tag)}
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
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
                <Button variant="outline" onClick={handleAttachImage}><Paperclip className="mr-2 h-4 w-4"/>Attach Image</Button>
                <Button variant="outline" onClick={() => setIsRecorderOpen(true)}><Mic className="mr-2 h-4 w-4"/>Record Audio</Button>
                <Button variant="outline" onClick={handleAttachAudio}><Upload className="mr-2 h-4 w-4"/>Upload Audio</Button>
                <Button variant="outline" onClick={() => setIsTranscriberOpen(true)}><BookText className="mr-2 h-4 w-4" />Transcribe (BU)</Button>
                <Button variant="outline" disabled={isAiLoading || !content} onClick={handleGenerateAudio}><Volume2 className="mr-2 h-4 w-4"/>Listen (BU)</Button>
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 bg-background border-t">
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isAiLoading}>
            {isAiLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI is working...
              </>
              ) : 'Save Note'}
          </Button>
        </SheetFooter>
      </SheetContent>
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
    </Sheet>
  );
}
