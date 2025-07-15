
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
  Lock,
  ScanLine,
  Bold,
  Italic,
  Strikethrough,
  Code,
  Undo2,
  Redo2,
  ClipboardPaste,
  Wand,
  SpellCheck,
  FileText,
  BrainCircuit,
  Globe,
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
import { checkGrammarAndSpelling } from "@/ai/flows/grammar-and-spelling-check";
import { smartPaste } from "@/ai/flows/smart-paste";
import { pinToDecentralizedStorage } from "@/ai/flows/pin-to-decentralized-storage";
import { DatePicker } from "../ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { KANBAN_COLUMN_TITLES, NOTE_PRIORITY_TITLES, NOTE_CATEGORIES, NOTE_CATEGORY_TITLES } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { useTemplates } from "@/contexts/templates-context";
import { hashText } from "@/lib/crypto";
import { Separator } from "../ui/separator";
import { useEditorHistory, type EditorState, areStatesEqual } from "@/hooks/use-editor-history";
import { useHotkeys } from "react-hotkeys-hook";
import { useAuth } from "@/contexts/auth-context";


// Lazy load dialogs
const AudioTranscriber = React.lazy(() => import('./audio-transcriber').then(module => ({ default: module.AudioTranscriber })));
const AudioRecorder = React.lazy(() => import('./audio-recorder').then(module => ({ default: module.AudioRecorder })));
const NoteVersionHistory = React.lazy(() => import('./note-version-history').then(module => ({ default: module.NoteVersionHistory })));
const HandwritingInput = React.lazy(() => import('./handwriting-input').then(module => ({ default: module.HandwritingInput })));
const SketchInput = React.lazy(() => import('./sketch-input').then(module => ({ default: module.SketchInput })));
const DocumentScanner = React.lazy(() => import('./document-scanner').then(module => ({ default: module.DocumentScanner })));


type NoteEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onSave: (noteToSave: Omit<Note, 'id' | 'userId'>) => void;
  isSaving?: boolean;
};

const formatTime = (time24: string | null | undefined): string => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const initialEditorState: EditorState = {
    title: '',
    content: '',
    summary: null,
    color: NOTE_COLORS[0],
    checklist: [],
    imageUrl: undefined,
    audioUrl: null,
    status: 'todo',
    priority: 'none',
    category: 'uncategorized',
    dueDate: null,
    startTime: null,
    endTime: null,
    showOnBoard: false,
    isPasswordProtected: false,
    password: undefined,
    cid: undefined,
};

export function NoteEditor({
  isOpen,
  setIsOpen,
  note,
  onSave,
  isSaving = false,
}: NoteEditorProps) {
  const { user } = useAuth();
  const { 
    state: editorState, 
    setState: setEditorState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    getInitialState,
  } = useEditorHistory(initialEditorState);

  const {
      title, content, summary, color, checklist, imageUrl, audioUrl: generatedAudio,
      status, priority, category, dueDate, startTime, endTime, showOnBoard,
      isPasswordProtected, password, cid
  } = editorState;
  
  const setTitle = (newTitle: string) => setEditorState({ ...editorState, title: newTitle });
  const setContent = (newContent: string) => setEditorState({ ...editorState, content: newContent });
  const setSummary = (newSummary: string | null) => setEditorState({ ...editorState, summary: newSummary });
  const setColor = (newColor: string) => setEditorState({ ...editorState, color: newColor });
  const setChecklist = (newChecklist: EditorState['checklist']) => setEditorState({ ...editorState, checklist: newChecklist });
  const setImageUrl = (newImageUrl: string | undefined) => setEditorState({ ...editorState, imageUrl: newImageUrl });
  const setGeneratedAudio = (newAudioUrl: string | null) => setEditorState({ ...editorState, audioUrl: newAudioUrl });
  const setStatus = (newStatus: NoteStatus) => setEditorState({ ...editorState, status: newStatus });
  const setPriority = (newPriority: NotePriority) => setEditorState({ ...editorState, priority: newPriority });
  const setCategory = (newCategory: NoteCategory) => setEditorState({ ...editorState, category: newCategory });
  const setDueDate = (newDueDate: Date | null | undefined) => setEditorState({ ...editorState, dueDate: newDueDate });
  const setStartTime = (newStartTime: string | null) => setEditorState({ ...editorState, startTime: newStartTime });
  const setEndTime = (newEndTime: string | null) => setEditorState({ ...editorState, endTime: newEndTime });
  const setShowOnBoard = (newShowOnBoard: boolean) => setEditorState({ ...editorState, showOnBoard: newShowOnBoard });
  const setIsPasswordProtected = (newIsPasswordProtected: boolean) => setEditorState({ ...editorState, isPasswordProtected: newIsPasswordProtected });
  const setPassword = (newPassword: string | undefined) => setEditorState({ ...editorState, password: newPassword });
  const setCid = (newCid: string | undefined) => setEditorState({ ...editorState, cid: newCid });


  const [newChecklistItem, setNewChecklistItem] = React.useState("");
  const [editingChecklistItemId, setEditingChecklistItemId] = React.useState<string | null>(null);
  
  const [isActionLoading, setIsActionLoading] = React.useState(false);
  const [isAutoAiRunning, setIsAutoAiRunning] = React.useState(false);
  const [isSmartMode, setIsSmartMode] = React.useState(true);

  const [isTranscriberOpen, setIsTranscriberOpen] = React.useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = React.useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [isHandwritingOpen, setIsHandwritingOpen] = React.useState(false);
  const [isSketcherOpen, setIsSketcherOpen] = React.useState(false);
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isCloseConfirmOpen, setIsCloseConfirmOpen] = React.useState(false);
  const [ignoredChecklistItems, setIgnoredChecklistItems] = React.useState(new Set<string>());
  const [templateToApply, setTemplateToApply] = React.useState<NoteTemplate | null>(null);
  const { templates } = useTemplates();
  const [suggestion, setSuggestion] = React.useState<string | null>(null);

  const [isKanbanConfirmOpen, setIsKanbanConfirmOpen] = React.useState(false);
  const prevChecklistLength = React.useRef(0);

  // Password state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState({current: "", new: "", confirm: ""});
  const [passwordError, setPasswordError] = React.useState("");

  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const audioInputRef = React.useRef<HTMLInputElement>(null);
  const autoChecklistRunning = React.useRef(false);
  const bgTextareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fgTextareaRef = React.useRef<HTMLTextAreaElement>(null);

  const { toast } = useToast();
  const isAiLoading = isActionLoading || isAutoAiRunning;
  const grammarDebounceTimer = React.useRef<NodeJS.Timeout | null>(null);

  useHotkeys('mod+z', undo, { enabled: isOpen && canUndo });
  useHotkeys('mod+y, mod+shift+z', redo, { enabled: isOpen && canRedo });

  const timeOptions = React.useMemo(() => {
    const options: { value: string; label: string }[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hour24 = h.toString().padStart(2, '0');
        const minute = m.toString().padStart(2, '0');
        const value = `${hour24}:${minute}`;
        const label = formatTime(value);
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  const syncTextareaHeights = React.useCallback(() => {
    if (fgTextareaRef.current && bgTextareaRef.current) {
        const fgTextarea = fgTextareaRef.current;
        const bgTextarea = bgTextareaRef.current;
        
        fgTextarea.style.height = 'auto';
        bgTextarea.style.height = 'auto';

        const scrollHeight = Math.max(fgTextarea.scrollHeight, bgTextarea.scrollHeight);
        
        const newHeight = `${scrollHeight}px`;

        fgTextarea.style.height = newHeight;
        bgTextarea.style.height = newHeight;
    }
  }, []);

  React.useLayoutEffect(() => {
    if (isOpen) {
      syncTextareaHeights();
    }
  }, [isOpen, content, suggestion, syncTextareaHeights]);

  React.useEffect(() => {
    if (isOpen) {
      setIgnoredChecklistItems(new Set());
      setSuggestion(null);

      // Reset scroll position
      if (bgTextareaRef.current) bgTextareaRef.current.scrollTop = 0;
      if (fgTextareaRef.current) fgTextareaRef.current.scrollTop = 0;

      const dataToLoad = note ? {
        title: note.title,
        content: note.content,
        summary: note.summary || null,
        color: note.color,
        checklist: note.checklist,
        imageUrl: note.imageUrl,
        audioUrl: note.audioUrl || null,
        status: note.status,
        priority: note.priority,
        category: note.category,
        dueDate: note.dueDate ? new Date(note.dueDate) : null,
        startTime: note.startTime || null,
        endTime: note.endTime || null,
        showOnBoard: note.showOnBoard || false,
        isPasswordProtected: note.isPasswordProtected || false,
        password: note.password || undefined,
        cid: note.cid || undefined,
      } : {
        ...initialEditorState,
        content: '',
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      };
      
      resetHistory(dataToLoad);
      prevChecklistLength.current = (note?.checklist || []).length;
    }
  }, [note, isOpen, resetHistory]);

  // Background AI task for auto checklist generation
  React.useEffect(() => {
    if (!isOpen || !isSmartMode) return;

    const handler = setTimeout(async () => {
      if (typeof content !== 'string' || !content.trim() || autoChecklistRunning.current || isAiLoading) return;
      
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
  }, [content, isOpen, toast, isAiLoading, ignoredChecklistItems, setChecklist, isSmartMode]);

  // Background AI for auto grammar fix and predictive text
  React.useEffect(() => {
    if (grammarDebounceTimer.current) {
        clearTimeout(grammarDebounceTimer.current);
    }

    if (!isOpen || !isSmartMode) {
      if(suggestion) setSuggestion(null); // Clear suggestion if smart mode is toggled off
      return;
    }
  
    grammarDebounceTimer.current = setTimeout(async () => {
      if (typeof content !== 'string' || !content.trim() || isActionLoading) return;
  
      setIsAutoAiRunning(true);
      setSuggestion(null);
  
      try {
        // Step 2: Get predictive text
        const containsBurmese = /[\u1000-\u109F]/.test(content);
        const language = containsBurmese ? 'Burmese' : 'English';
        const completionResult = await completeText({ currentText: content, language });
        
        // Check if user typed while AI was working.
        if (fgTextareaRef.current && fgTextareaRef.current.value !== content) {
          setIsAutoAiRunning(false);
          return;
        }
  
        if (completionResult.completion) {
          setSuggestion(completionResult.completion);
        }
  
      } catch (error) {
        console.error("Background AI task failed:", error);
      } finally {
        setIsAutoAiRunning(false);
      }
    }, 1500); // 1.5 second debounce
  
    return () => {
        if (grammarDebounceTimer.current) {
            clearTimeout(grammarDebounceTimer.current);
        }
    };
  }, [content, isOpen, isActionLoading, toast, isSmartMode]);


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
  }, [dueDate, setStartTime, setEndTime]);
  
  const handleSave = React.useCallback(() => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to save notes.', variant: 'destructive'});
      return;
    }

    if (!title && !content) {
      toast({
        title: 'Empty Note',
        description: 'Please add a title or some content to your note.',
        variant: 'destructive',
      });
      return;
    }

    const newNoteData: Omit<Note, 'id' | 'userId'> = {
      userId: user.uid,
      title, content: content || '', summary, color,
      isPinned: note?.isPinned || false, isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false, createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), checklist, history: note?.history || [],
      isDraft: false, status, priority, category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      startTime: dueDate ? startTime : null,
      endTime: dueDate ? endTime : null,
      showOnBoard, order: note?.order || Date.now(),
      isPasswordProtected, password,
      imageUrl,
      audioUrl: generatedAudio,
      cid,
    };
    
    onSave(newNoteData);
  }, [title, content, summary, color, checklist, imageUrl, generatedAudio, status, priority, category, dueDate, startTime, endTime, showOnBoard, isPasswordProtected, password, cid, note, onSave, toast, user]);
  
  const handleDiscardChanges = React.useCallback(() => {
    if (note) {
      resetHistory({
        title: note.title,
        content: note.content,
        summary: note.summary || null,
        color: note.color,
        checklist: note.checklist,
        imageUrl: note.imageUrl,
        audioUrl: note.audioUrl || null,
        status: note.status,
        priority: note.priority,
        category: note.category,
        dueDate: note.dueDate ? new Date(note.dueDate) : null,
        startTime: note.startTime || null,
        endTime: note.endTime || null,
        showOnBoard: note.showOnBoard || false,
        isPasswordProtected: note.isPasswordProtected || false,
        password: note.password || undefined,
        cid: note.cid || undefined,
      });
      toast({ title: "Changes discarded", description: "Your changes have been discarded." });
    }
  }, [note, resetHistory, toast]);
  
  const handleSaveAsDraftAndClose = React.useCallback(() => {
    if (!user) {
      toast({ title: 'Not Authenticated', description: 'You must be logged in to save notes.', variant: 'destructive'});
      return;
    }
    const draftNoteData: Omit<Note, 'id' | 'userId'> = {
      userId: user.uid,
      title, content: content || '', summary, color,
      isPinned: note?.isPinned || false, isArchived: note?.isArchived || false,
      isTrashed: note?.isTrashed || false, createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(), checklist, history: note?.history || [],
      isDraft: true, status, priority, category,
      dueDate: dueDate ? dueDate.toISOString() : null,
      startTime: dueDate ? startTime : null,
      endTime: dueDate ? endTime : null,
      showOnBoard, order: note?.order || Date.now(),
      isPasswordProtected, password,
      imageUrl,
      audioUrl: generatedAudio,
      cid,
    };
    
    onSave(draftNoteData);
    setIsCloseConfirmOpen(false);
  }, [title, content, summary, color, checklist, imageUrl, generatedAudio, status, priority, category, dueDate, startTime, endTime, showOnBoard, isPasswordProtected, password, cid, note, onSave, user, toast]);

  const handleDiscardAndClose = React.useCallback(() => {
    setIsCloseConfirmOpen(false);
    setIsOpen(false);
  }, [setIsOpen]);
  
  const handleAddChecklistItem = React.useCallback(() => {
    if (newChecklistItem.trim()) {
      setChecklist([ ...checklist, { id: new Date().toISOString(), text: newChecklistItem.trim(), completed: false }]);
      setNewChecklistItem("");
    }
  }, [newChecklistItem, checklist, setChecklist]);

  const handleToggleChecklistItem = React.useCallback((id: string) => {
    setChecklist(checklist.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
  }, [checklist, setChecklist]);

  const handleUpdateChecklistItemText = React.useCallback((id: string, newText: string) => {
    if (newText.trim()) {
      setChecklist(checklist.map((item) => item.id === id ? { ...item, text: newText.trim() } : item));
    }
    setEditingChecklistItemId(null);
  }, [checklist, setChecklist]);

  const handleRemoveChecklistItem = React.useCallback((id: string) => {
    const itemToRemove = checklist.find((item) => item.id === id);
    if (itemToRemove) {
      setIgnoredChecklistItems(prev => new Set(prev).add(itemToRemove.text.trim().toLowerCase()));
    }
    setChecklist(checklist.filter((item) => item.id !== id));
  }, [checklist, setChecklist]);

  const runAiAction = React.useCallback(async (action: () => Promise<boolean | void>, messages: {success: string, error: string}) => {
    setIsActionLoading(true);
    try {
        const shouldToast = await action();
        if (shouldToast !== false) toast({ title: messages.success });
    } catch(error: any) {
        toast({ title: "AI Error", description: error.message || messages.error, variant: "destructive"});
    }
    setIsActionLoading(false);
  }, [toast]);
  
  const handleGenerateTitle = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate a title.");
    const result = await generateTitle({ noteContent: content });
    if (result.title) setTitle(result.title);
  }, { success: "Title Generated!", error: "Could not generate title." }), [content, runAiAction, setTitle]);
  
  const handleSummarizeNote = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to summarize.");
    const result = await summarizeNote({ noteContent: content });
    if (result.summary) {
        setSummary(result.summary);
    }
  }, { success: "Note Summarized!", error: "Could not summarize note." }), [content, runAiAction, setSummary]);


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab' && suggestion) {
      e.preventDefault(); // Prevent focus change
      setContent(currentContent => (currentContent || '') + suggestion);
      setSuggestion(null);
    }
  };

  const handleExtractText = React.useCallback(() => runAiAction(async () => {
    if(!imageUrl) throw new Error("Please attach an image first.");
    const result = await extractTextFromImage({ imageDataUri: imageUrl });
    if (result.extractedText && result.extractedText.trim()) {
      setContent(prev => `${prev || ''}\n\n--- Extracted Text ---\n${result.extractedText}`.trim());
    } else {
      toast({
          title: "No Text Found",
          description: "The AI could not find any text in the image.",
      });
      return false; // prevent success toast
    }
  }, { success: "Text Extracted!", error: "Could not extract text from the image." }), [imageUrl, runAiAction, toast, setContent]);

  const handleGenerateAudio = React.useCallback(() => runAiAction(async () => {
    if(!content) throw new Error("Please write some content to generate audio.");
    const result = await burmeseTextToVoice(content);
    if(result.media) setGeneratedAudio(result.media);
  }, { success: "Audio Generated!", error: "Could not generate audio." }), [content, runAiAction, setGeneratedAudio]);

  const handleTranslate = React.useCallback(() => runAiAction(async () => {
    if (!content && checklist.length === 0) throw new Error("Please add content or checklist items to translate.");
    const result = await translateNote({
      noteContent: content || '',
      checklistItems: checklist.map(item => ({ id: item.id, text: item.text })),
      targetLanguage: "Burmese",
    });

    if (result.translatedContent) setContent(result.translatedContent);
    if (result.translatedChecklistItems && result.translatedChecklistItems.length > 0) {
      const translatedMap = new Map(result.translatedChecklistItems.map(item => [item.id, item.translatedText]));
      setChecklist(prev => prev.map(item => ({...item, text: translatedMap.get(item.id) || item.text})));
    }
  }, { success: "Note translated to Burmese!", error: "Could not translate note." }), [content, checklist, runAiAction, setContent, setChecklist]);
  
  const handleSmartPaste = React.useCallback(() => runAiAction(async () => {
    try {
        const pastedText = await navigator.clipboard.readText();
        if (!pastedText.trim()) {
            toast({ title: "Clipboard is empty", variant: "destructive" });
            return false;
        }

        const result = await smartPaste({ pastedText });

        const newState: EditorState = {
            ...editorState,
            title: result.title,
            content: result.content,
            checklist: result.checklist ? result.checklist.map(item => ({...item, id: new Date().toISOString() + Math.random(), completed: false})) : [],
        };
        setEditorState(newState);
        toast({ title: "Smart Paste Complete!", description: "AI has organized the pasted content." });
        return false;

    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
             toast({ title: "Clipboard Permission Denied", description: "Please allow clipboard access in your browser settings.", variant: "destructive" });
        } else {
            console.error("Smart paste error:", error);
            toast({ title: "Paste Failed", description: "Could not read from clipboard.", variant: "destructive" });
        }
        return false;
    }
  }, { success: "", error: "Could not process the pasted text."}), [runAiAction, setEditorState, toast, editorState]);

  const handleContinueWriting = React.useCallback(() => runAiAction(async () => {
    if (!content || !content.trim()) throw new Error("Please write some content first.");
    const containsBurmese = /[\u1000-\u109F]/.test(content);
    const language = containsBurmese ? 'Burmese' : 'English';
    const result = await completeText({ currentText: content, language });
    if (result.completion) {
      setContent(prev => (prev || '') + result.completion);
    }
  }, { success: "AI completed your text!", error: "Could not complete text."}), [content, runAiAction, setContent]);

  const handleFixGrammar = React.useCallback(() => runAiAction(async () => {
    if (!content || !content.trim()) throw new Error("Please write some content first.");
    const containsBurmese = /[\u1000-\u109F]/.test(content);
    const language = containsBurmese ? 'Burmese' : 'English';
    const result = await checkGrammarAndSpelling({ text: content, language });
    if (result.correctedText && result.correctedText !== content) {
      setContent(result.correctedText);
    } else {
      toast({ title: "No Errors Found", description: "The AI didn't find any grammar or spelling mistakes."});
      return false;
    }
  }, { success: "Grammar and spelling fixed!", error: "Could not check grammar." }), [content, runAiAction, toast, setContent]);
  
  const handlePinToIpfs = React.useCallback(() => runAiAction(async () => {
    if (!content && !title) throw new Error("Please add a title or content to pin.");
    const result = await pinToDecentralizedStorage({ title, content: content || '' });
    if (result.cid) {
        setCid(result.cid);
        toast({
            title: "Note Pinned to IPFS!",
            description: `Your note's Content ID (CID) is ${result.cid.substring(0, 12)}...`,
        });
        return false;
    }
  }, { success: "Note pinned!", error: "Could not pin note." }), [content, title, runAiAction, setCid, toast]);

  const handleTranscriptionComplete = React.useCallback((text: string) => {
    setContent(prev => [prev, text].filter(Boolean).join('\n\n'));
  }, [setContent]);
  
  const handleHandwritingComplete = React.useCallback((text: string) => {
    setContent(prev => [prev, text].filter(Boolean).join('\n'));
  }, [setContent]);
  
  const handleTextScanned = React.useCallback((text: string) => {
    setContent(prev => `${prev || ''}\n\n--- Scanned Text ---\n${text}`.trim());
  }, [setContent]);

  const handleSaveSketch = React.useCallback((dataUrl: string) => {
    setImageUrl(dataUrl);
    toast({ title: "Sketch Attached" });
  }, [toast, setImageUrl]);

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
  }, [toast, setImageUrl]);

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
  }, [toast, setGeneratedAudio]);

  const handleSaveRecording = React.useCallback((blob: Blob) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      setGeneratedAudio(reader.result as string);
      toast({ title: "Audio Attached" });
    };
  }, [toast, setGeneratedAudio]);

  const handleRestoreVersion = React.useCallback((version: NoteVersion) => {
    setTitle(version.title);
    setContent(version.content);
    toast({ title: "Version Restored" });
  }, [toast, setTitle, setContent]);

  const applyTemplate = (template: NoteTemplate) => {
    const today = new Date().toLocaleDateString();
    let newContent = template.content;
    let newTitle = template.title || '';
    if(newTitle) newTitle = newTitle.replace(/\[Date\]/g, today);
    
    setEditorState({
        ...editorState,
        title: newTitle,
        content: newContent,
        checklist: template.checklist ? template.checklist.map(item => ({ ...item, id: new Date().toISOString() + Math.random(), completed: false })) : [],
        category: template.category || 'uncategorized'
    });

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

  const openPasswordDialog = () => {
    setPasswordInput({current: "", new: "", confirm: ""});
    setPasswordError("");
    setIsPasswordDialogOpen(true);
  }
  
  const handlePasswordSave = async () => {
    setPasswordError("");
    // Scenario 1: Setting a new password
    if (!password) {
      if (!passwordInput.new) {
        setPasswordError("Password cannot be empty.");
        return;
      }
      if (passwordInput.new !== passwordInput.confirm) {
        setPasswordError("Passwords do not match.");
        return;
      }
      const newPasswordHash = await hashText(passwordInput.new);
      setPassword(newPasswordHash);
      setIsPasswordProtected(true);
      toast({ title: "Password Set" });
    } else { // Scenario 2: Changing or removing password
      const currentPasswordHash = await hashText(passwordInput.current);
      if (currentPasswordHash !== password) {
        setPasswordError("Incorrect current password.");
        return;
      }
       if (!passwordInput.new && !passwordInput.confirm) { // Removing the password
        setPassword(undefined);
        setIsPasswordProtected(false);
        toast({ title: "Password Removed" });
      } else { // Changing it
        if (passwordInput.new !== passwordInput.confirm) {
          setPasswordError("New passwords do not match.");
          return;
        }
        if (!passwordInput.new) {
          setPasswordError("New password cannot be empty.");
          return;
        }
        const newPasswordHash = await hashText(passwordInput.new);
        setPassword(newPasswordHash);
        toast({ title: "Password Changed" });
      }
    }
    setIsPasswordDialogOpen(false);
    setPasswordInput({current: "", new: "", confirm: ""});
  };

  const applyMarkdown = (syntax: 'bold' | 'italic' | 'strikethrough' | 'code') => {
    const textarea = fgTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = (content || '').substring(start, end);

    const markers = {
        bold: '**',
        italic: '*',
        strikethrough: '~~',
        code: '`'
    };
    const marker = markers[syntax];
    const newText = `${(content || '').substring(0, start)}${marker}${selectedText}${marker}${(content || '').substring(end)}`;
    
    setContent(newText);

    // Focus and set cursor position after update
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + marker.length;
        textarea.selectionEnd = end + marker.length;
    }, 0);
  };

  const handleCloseAttempt = (e: React.MouseEvent) => {
    const isDirty = !areStatesEqual(getInitialState(), editorState);
    if (isDirty && !isSaving) {
      e.preventDefault();
      setIsCloseConfirmOpen(true);
    }
  };

  return (
    <>
      <Sheet open={isOpen}>
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
                  <Input id="title" value={title || ''} onChange={(e) => setTitle(e.target.value)} placeholder="Note title"/>
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
                <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
                    <div className="p-2 flex items-center gap-1 border-b">
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown('bold')}><Bold className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Bold</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown('italic')}><Italic className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Italic</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown('strikethrough')}><Strikethrough className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Strikethrough</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => applyMarkdown('code')}><Code className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Code</p></TooltipContent></Tooltip>
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo}><Undo2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Undo (Ctrl+Z)</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo}><Redo2 className="h-4 w-4"/></Button></TooltipTrigger><TooltipContent><p>Redo (Ctrl+Y)</p></TooltipContent></Tooltip>
                        <div className="flex-grow" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSmartMode(!isSmartMode)}
                                    className={cn(isSmartMode && "text-primary bg-primary/10")}
                                >
                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                    Smart Mode
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Toggle AI auto-correction and prediction</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <div className="relative grid">
                        <Textarea
                            ref={bgTextareaRef}
                            readOnly
                            className="col-start-1 row-start-1 resize-none whitespace-pre-wrap text-muted-foreground [caret-color:transparent] min-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            value={suggestion ? (content || '') + suggestion : (content || '')}
                            tabIndex={-1}
                        />
                        <Textarea
                            ref={fgTextareaRef}
                            id="content"
                            value={content || ''}
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
                            placeholder="Start writing... AI will suggest completions automatically. Or, type a prompt and click 'Generate Note'."
                            className="col-start-1 row-start-1 resize-none whitespace-pre-wrap bg-transparent text-foreground min-h-[200px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground px-1">
                        Press <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Tab</kbd> to accept an AI suggestion.
                    </p>
                    <p className="text-xs text-muted-foreground px-1">
                        Math? Use $...$ or $$\...$$
                    </p>
                </div>
              </div>

              {summary && (
                <div className="space-y-2">
                    <Label>AI Summary</Label>
                    <div className="relative rounded-lg border bg-secondary/50 p-4 pr-10">
                        <p className="text-sm italic">{summary}</p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-7 w-7"
                            onClick={() => setSummary(null)}
                        >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
              )}

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
                        <Label>Date &amp; Time</Label>
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
                  <Button variant="outline" disabled={isAiLoading} onClick={handleSmartPaste}>
                    <ClipboardPaste className="mr-2 h-4 w-4"/>Smart Paste
                  </Button>
                  <Button variant="outline" disabled={isAiLoading || !content || !!summary} onClick={handleSummarizeNote}><BotMessageSquare className="mr-2 h-4 w-4"/>Summarize</Button>
                  <Button variant="outline" disabled={isAiLoading || (!content && checklist.length === 0)} onClick={handleTranslate}><Languages className="mr-2 h-4 w-4"/>Translate</Button>
                  
                  <Button variant="outline" onClick={() => setIsHandwritingOpen(true)}><PenLine className="mr-2 h-4 w-4"/>Write</Button>
                  <Button variant="outline" onClick={() => setIsScannerOpen(true)}><ScanLine className="mr-2 h-4 w-4"/>Scan</Button>
                  <Button variant="outline" onClick={() => setIsSketcherOpen(true)}><Palette className="mr-2 h-4 w-4"/>Sketch</Button>
                  <Button variant="outline" onClick={handleAttachImage}><Paperclip className="mr-2 h-4 w-4"/>Attach Image</Button>
                  <Button variant="outline" disabled={!note} onClick={() => setIsHistoryOpen(true)}><History className="mr-2 h-4 w-4"/>History</Button>
                  <Button variant="outline" disabled={isAiLoading} onClick={handlePinToIpfs}><Globe className="mr-2 h-4 w-4" />Pin to IPFS</Button>
                  
                  <Button variant="outline" onClick={() => setIsRecorderOpen(true)}><Mic className="mr-2 h-4 w-4"/>Record Audio</Button>
                  <Button variant="outline" onClick={handleAttachAudio}><Upload className="mr-2 h-4 w-4"/>Upload Audio</Button>
                  <Button variant="outline" onClick={() => setIsTranscriberOpen(true)}><BookText className="mr-2 h-4 w-4" />Transcribe</Button>
                  <Button variant="outline" disabled={isAiLoading || !content} onClick={handleGenerateAudio}><Volume2 className="mr-2 h-4 w-4"/>Listen (Burmese)</Button>
                  <Button variant="outline" onClick={openPasswordDialog}><Lock className="mr-2 h-4 w-4"/>Password</Button>
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 bg-background border-t flex items-center gap-2">
            <div className="mr-auto">
              {note && !areStatesEqual(getInitialState(), editorState) && (<Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDiscardChanges}>Discard Changes</Button>)}
            </div>
            <span className="text-sm text-muted-foreground">{isSaving ? "Saving..." : isAiLoading ? "AI is working..." : !areStatesEqual(getInitialState(), editorState) ? "Unsaved changes" : note ? "All changes saved" : ""}</span>
            <SheetClose asChild>
              <Button variant="outline" onClick={handleCloseAttempt}>Cancel</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={isAiLoading || areStatesEqual(getInitialState(), editorState) || isSaving}>
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
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{password ? "Change or Remove Password" : "Set Password"}</AlertDialogTitle>
                <AlertDialogDescription>
                    {password ? "Enter your current password to make changes, or leave the new password fields blank to remove protection." : "Secure this note with a password. Remember it, as it cannot be recovered."}
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-2">
                {password && (
                     <div className="space-y-1">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" value={passwordInput.current} onChange={(e) => setPasswordInput(p => ({...p, current: e.target.value}))} />
                     </div>
                )}
                <div className="space-y-1">
                    <Label htmlFor="new-password">New Password {password ? "(leave blank to remove)" : ""}</Label>
                    <Input id="new-password" type="password" value={passwordInput.new} onChange={(e) => setPasswordInput(p => ({...p, new: e.target.value}))} />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={passwordInput.confirm} onChange={(e) => setPasswordInput(p => ({...p, confirm: e.target.value}))} />
                </div>
                {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
            </div>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handlePasswordSave}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <React.Suspense fallback={null}>
        {isTranscriberOpen && <AudioTranscriber open={isTranscriberOpen} setOpen={setIsTranscriberOpen} onTranscriptionComplete={handleTranscriptionComplete}/>}
        {isRecorderOpen && <AudioRecorder open={isRecorderOpen} setOpen={setIsRecorderOpen} onSave={handleSaveRecording}/>}
        {isHistoryOpen && <NoteVersionHistory open={isHistoryOpen} setOpen={setIsHistoryOpen} history={note?.history || []} onRestore={handleRestoreVersion}/>}
        {isHandwritingOpen && <HandwritingInput open={isHandwritingOpen} setOpen={setIsHandwritingOpen} onRecognitionComplete={handleHandwritingComplete} />}
        {isSketcherOpen && <SketchInput open={isSketcherOpen} setOpen={setIsSketcherOpen} onSave={handleSaveSketch}/>}
        {isScannerOpen && <DocumentScanner open={isScannerOpen} setOpen={setIsScannerOpen} onTextExtracted={handleTextScanned} />}
      </React.Suspense>
    </>
  );
}
