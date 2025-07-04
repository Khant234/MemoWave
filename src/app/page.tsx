

"use client";

import * as React from "react";
import { useSearchParams, useRouter } from 'next/navigation'
import { useHotkeys } from "react-hotkeys-hook";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { NoteList } from "@/components/app/note-list";
import { type Note, type NoteVersion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { useNotes } from "@/contexts/notes-context";
import { useGamification } from "@/contexts/gamification-context";
import { generateTitle } from "@/ai/flows/title-generation";
import { type GenerateGoalPlanOutput } from "@/ai/flows/generate-goal-plan";
import { NOTE_COLORS } from "@/lib/data";
import { MobileFab } from "@/components/app/mobile-fab";
import { isToday, isYesterday, isThisWeek } from 'date-fns';

// Lazy load modals and heavy components
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const NoteEditor = React.lazy(() => import('@/components/app/note-editor').then(module => ({ default: module.NoteEditor })));
const AudioTranscriber = React.lazy(() => import('@/components/app/audio-transcriber').then(module => ({ default: module.AudioTranscriber })));
const GoalPlanner = React.lazy(() => import('@/components/app/goal-planner').then(module => ({ default: module.GoalPlanner })));


export default function Home() {
  const { notes, isLoading, allTags } = useNotes();
  const [isSaving, setIsSaving] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "archived" | "trash">(
    "all"
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const { toast } = useToast();
  
  // State for viewer and editor
  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [isTranscriberOpen, setIsTranscriberOpen] = React.useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = React.useState(false);


  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    noteId: string;
    type: 'trash' | 'permanent';
  } | null>(null);
  const [isEmptryTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = React.useState(false);

  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recordTaskCompletion } = useGamification();


  const notesCollectionRef = React.useMemo(() => collection(db, "notes"), []);

  React.useEffect(() => {
    const filter = searchParams.get('filter');
    if (filter === 'archived' || filter === 'trash') {
      setActiveFilter(filter);
    } else {
      setActiveFilter('all');
    }

    const q = searchParams.get('q');
    setSearchTerm(q || '');
  }, [searchParams]);

  const handleViewNote = React.useCallback((note: Note) => {
    setViewingNote(note);
    setIsViewerOpen(true);
  }, []);

  React.useEffect(() => {
    const noteIdToOpen = searchParams.get('note');
    if (noteIdToOpen && notes.length > 0) {
      const note = notes.find(n => n.id === noteIdToOpen);
      if (note) {
        handleViewNote(note);
        // Clean up URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('note');
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }
    }
  }, [searchParams, notes, router, handleViewNote]);
  
  const handleNewNote = React.useCallback(() => {
    setEditingNote(null);
    setIsEditorOpen(true);
  }, []);

  useHotkeys("n", () => handleNewNote(), { preventDefault: true });

  const handleNewVoiceNote = React.useCallback(() => {
    setIsTranscriberOpen(true);
  }, []);

  const handleNewPlan = React.useCallback(() => {
    setIsPlannerOpen(true);
  }, []);

  const handleStartEditing = React.useCallback((note: Note) => {
    setIsViewerOpen(false);
    setEditingNote(note);
    setIsEditorOpen(true);
  }, []);

  const handleTranscriptionToNewNote = React.useCallback(async (transcription: string) => {
    if (!transcription.trim()) {
      toast({
        title: "Empty Transcription",
        description: "The audio didn't produce any text.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const titleResult = await generateTitle({ noteContent: transcription });
      const newTitle = titleResult.title || "Voice Note";

      const newNoteData: Omit<Note, 'id'> = {
        title: newTitle,
        content: transcription,
        tags: ["voice-note"],
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
        isPinned: false,
        isArchived: false,
        isTrashed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        checklist: [],
        history: [],
        isDraft: false,
        status: 'todo',
        priority: 'none',
        dueDate: null,
        showOnBoard: true,
        order: Date.now(),
      };

      const docRef = await addDoc(notesCollectionRef, newNoteData);
      
      toast({
        title: "Voice Note Created",
        description: `Your new note "${newTitle}" has been created.`,
      });
      
      const newNote = { ...newNoteData, id: docRef.id } as Note;
      handleViewNote(newNote);

    } catch (error) {
      console.error("Error creating voice note:", error);
      toast({
        title: "Error Creating Voice Note",
        description: "There was a problem saving your transcribed note.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [notesCollectionRef, toast, handleViewNote]);


  const handleSaveNote = React.useCallback(async (noteToSave: Note) => {
    setIsSaving(true);
    
    const isExisting = notes.some((n) => n.id === noteToSave.id);

    try {
      if (isExisting) {
        const originalNote = notes.find((n) => n.id === noteToSave.id);
        
        let newHistory: Note['history'] = originalNote?.history ? [...originalNote.history] : [];
        if (originalNote && (originalNote.content !== noteToSave.content || originalNote.title !== noteToSave.title)) {
            const version: NoteVersion = {
                title: originalNote.title,
                content: originalNote.content,
                updatedAt: originalNote.updatedAt,
            };
            newHistory.unshift(version);
        }
        if (newHistory.length > 20) {
            newHistory = newHistory.slice(0, 20);
        }

        const noteRef = doc(db, "notes", noteToSave.id);
        const {id, ...noteData} = noteToSave;
        const finalNoteData = { ...noteData, history: newHistory };
        await updateDoc(noteRef, finalNoteData as any);

      } else {
        const { id, ...noteData } = noteToSave;
        const finalNoteData = { ...noteData, history: [] };
        await addDoc(notesCollectionRef, finalNoteData as any);
      }

      setIsEditorOpen(false);
      setEditingNote(null);
      
      if (noteToSave.isDraft) {
        toast({
          title: "Draft Saved",
          description: "Your note has been saved as a draft.",
        });
      } else {
        toast({
          title: "Note Saved",
          description: `Your note "${noteToSave.title || 'Untitled'}" has been saved.`,
        });
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error Saving Note",
        description: "There was a problem saving your note.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
    }
  }, [notes, toast, notesCollectionRef]);
  
  const handleSavePlan = React.useCallback(async (planNotes: GenerateGoalPlanOutput['notes']) => {
    if (planNotes.length === 0) return;

    const batch = writeBatch(db);
    
    planNotes.forEach((planNote, index) => {
        const newNoteData: Omit<Note, 'id'> = {
            title: planNote.title,
            content: planNote.content,
            tags: [...planNote.tags, "goal-plan"],
            color: NOTE_COLORS[index % NOTE_COLORS.length],
            isPinned: false,
            isArchived: false,
            isTrashed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            checklist: planNote.checklist.map(item => ({...item, id: new Date().toISOString() + Math.random(), completed: false })),
            history: [],
            isDraft: false,
            status: 'todo',
            priority: 'medium',
            dueDate: planNote.dueDate,
            showOnBoard: true,
            order: Date.now() + index,
        };
        const newNoteRef = doc(notesCollectionRef);
        batch.set(newNoteRef, newNoteData);
    });

    await batch.commit();

  }, [notesCollectionRef]);

  const updateNoteField = React.useCallback(async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    setViewingNote(prev => (prev && prev.id === noteId) ? { ...prev, ...updates } : prev);

    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, updates);
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error Updating Note",
        description: "Could not sync changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleChecklistItemToggle = React.useCallback((noteId: string, checklistItemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      recordTaskCompletion(note, checklistItemId);
      
      const updatedChecklist = note.checklist.map((item) =>
        item.id === checklistItemId
          ? { ...item, completed: !item.completed }
          : item
      );

      const allItemsComplete = updatedChecklist.length > 0 && updatedChecklist.every(item => item.completed);
      const updates: Partial<Omit<Note, 'id'>> = { checklist: updatedChecklist };

      if (allItemsComplete && note.status !== 'done') {
        updates.status = 'done';
        toast({
          title: `List Complete!`,
          description: `All items in "${note.title}" are done. The note status has been updated.`,
        });
      }
      
      updateNoteField(noteId, updates);
    }
  }, [notes, recordTaskCompletion, toast, updateNoteField]);

  const handleTogglePin = React.useCallback((noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      updateNoteField(noteId, { isPinned: !note.isPinned });
    }
  }, [notes, updateNoteField]);

  const handleToggleArchive = React.useCallback((noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      updateNoteField(noteId, { isArchived: !note.isArchived, isPinned: false });
    }
  }, [notes, updateNoteField]);

  const handleMoveToTrash = React.useCallback((noteId: string) => {
    setDeleteConfirmation({ noteId, type: 'trash' });
  }, []);

  const handleRestoreNote = React.useCallback((noteId: string) => {
    updateNoteField(noteId, { isTrashed: false });
  }, [updateNoteField]);

  const handlePermanentlyDeleteNote = React.useCallback((noteId: string) => {
    setDeleteConfirmation({ noteId, type: 'permanent' });
  }, []);

  const handleEmptyTrash = React.useCallback(() => {
    setIsEmptyTrashConfirmOpen(true);
  }, []);

  const handleConfirmEmptyTrash = React.useCallback(async () => {
    const trashedNotes = notes.filter(note => note.isTrashed);
    if (trashedNotes.length === 0) {
      setIsEmptyTrashConfirmOpen(false);
      return;
    }

    const batch = writeBatch(db);
    trashedNotes.forEach(note => {
      const noteRef = doc(db, "notes", note.id);
      batch.delete(noteRef);
    });

    try {
      await batch.commit();
      toast({
        title: "Trash Emptied",
        description: "All notes in the trash have been permanently deleted.",
      });
    } catch (error) {
      console.error("Error emptying trash:", error);
      toast({
        title: "Error Emptying Trash",
        description: "Could not empty trash. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEmptyTrashConfirmOpen(false);
    }
  }, [notes, toast]);

  const handleCopyNote = React.useCallback(async (noteId: string) => {
    const noteToCopy = notes.find((n) => n.id === noteId);
    if (!noteToCopy) {
      toast({
        title: "Error",
        description: "Note to copy not found.",
        variant: "destructive",
      });
      return;
    }

    const { id, isPinned, createdAt, updatedAt, history, ...restOfNote } = noteToCopy;

    const newNoteData = {
      ...restOfNote,
      title: `Copy of ${noteToCopy.title || 'Untitled'}`,
      isPinned: false,
      isDraft: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [],
      showOnBoard: noteToCopy.showOnBoard,
      order: Date.now(),
    };

    try {
      await addDoc(notesCollectionRef, newNoteData);
      toast({
        title: "Note Copied",
        description: `A copy of "${noteToCopy.title || 'Untitled'}" has been created.`,
      });
    } catch (error) {
      console.error("Error copying note:", error);
      toast({
        title: "Error Copying Note",
        description: "There was a problem copying your note.",
        variant: "destructive",
      });
    }
  }, [notes, toast, notesCollectionRef]);

  const handleTagClick = React.useCallback((tag: string) => {
    router.push(`/?q=${tag}`);
  }, [router]);
  
  const handleRemoveTagFromNote = React.useCallback(async (noteId: string, tagToRemove: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      const updatedTags = note.tags.filter((tag) => tag !== tagToRemove);
      await updateNoteField(noteId, { tags: updatedTags });
      toast({
        title: "Tag removed",
        description: `The tag "${tagToRemove}" has been removed from the note.`,
      });
    }
  }, [notes, toast, updateNoteField]);

  const handleConfirmDelete = React.useCallback(async () => {
    if (!deleteConfirmation) return;
    const { noteId, type } = deleteConfirmation;

    if (type === 'trash') {
      await updateNoteField(noteId, { isTrashed: true, isPinned: false });
      toast({
        title: "Note moved to trash",
        description: "You can restore it from the trash folder.",
      });
    } else if (type === 'permanent') {
      if (viewingNote?.id === noteId) {
        setIsViewerOpen(false);
        setViewingNote(null);
      }
      try {
        await deleteDoc(doc(db, "notes", noteId));
        toast({
          title: "Note permanently deleted",
        });
      } catch (error) {
        console.error("Error deleting note:", error);
        toast({
          title: "Error Deleting Note",
          variant: "destructive",
        });
      }
    }
    setDeleteConfirmation(null);
  }, [deleteConfirmation, toast, updateNoteField, viewingNote?.id]);
  
  const handleCancelDelete = React.useCallback(() => {
    setDeleteConfirmation(null);
  }, []);


  const filteredNotes = React.useMemo(() => {
    return notes
      .filter((note) => {
        let matchesFilter;
        switch (activeFilter) {
          case 'all':
            matchesFilter = !note.isArchived && !note.isTrashed;
            break;
          case 'archived':
            matchesFilter = note.isArchived && !note.isTrashed;
            break;
          case 'trash':
            matchesFilter = note.isTrashed;
            break;
          default:
            matchesFilter = true;
        }
        
        const searchInput = searchTerm.toLowerCase();
        if (searchInput.startsWith('#')) {
            const searchTag = searchInput.substring(1).replace(/"/g, '');
            return matchesFilter && note.tags.some(tag => tag.toLowerCase().includes(searchTag));
        }

        const matchesSearch =
          searchTerm.trim() === "" ||
          note.title.toLowerCase().includes(searchInput) ||
          note.content.toLowerCase().includes(searchInput) ||
          note.tags.some((tag) =>
            tag.toLowerCase().includes(searchInput)
          );
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (activeFilter !== 'trash') {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [notes, activeFilter, searchTerm]);

  const groupedNotes = React.useMemo(() => {
    if (activeFilter !== 'all' || searchTerm.trim() !== '') {
      if (filteredNotes.length === 0) return {};
      return { 'Results': filteredNotes };
    }

    const groups: Record<string, Note[]> = {};
    const pinned = filteredNotes.filter(n => n.isPinned);
    const unpinned = filteredNotes.filter(n => !n.isPinned);

    if (pinned.length > 0) {
      groups['Pinned'] = pinned;
    }

    unpinned.forEach(note => {
      const noteDate = new Date(note.updatedAt);
      if (isToday(noteDate)) {
        if (!groups['Today']) groups['Today'] = [];
        groups['Today'].push(note);
      } else if (isYesterday(noteDate)) {
        if (!groups['Yesterday']) groups['Yesterday'] = [];
        groups['Yesterday'].push(note);
      } else if (isThisWeek(noteDate, { weekStartsOn: 1 })) {
        if (!groups['This Week']) groups['This Week'] = [];
        groups['This Week'].push(note);
      } else {
        if (!groups['Earlier']) groups['Earlier'] = [];
        groups['Earlier'].push(note);
      }
    });

    return groups;

  }, [filteredNotes, activeFilter, searchTerm]);

  return (
    <>
      <div className="flex h-screen w-full flex-col bg-secondary">
        <AppHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          layout={layout}
          setLayout={setLayout}
          onNewNote={handleNewNote}
          onNewVoiceNote={handleNewVoiceNote}
          onNewPlan={handleNewPlan}
          onToggleSidebar={toggleSidebar}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          tags={allTags}
          onTagClick={handleTagClick}
          activeTag={searchTerm}
        />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            setSearchTerm={setSearchTerm}
            tags={allTags}
            onTagClick={handleTagClick}
            activeTag={searchTerm}
          />
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 transition-all duration-300 ease-in-out">
            <div className="mx-auto max-w-7xl">
              <NoteList
                groupedNotes={groupedNotes}
                isLoading={isLoading}
                layout={layout}
                onViewNote={handleViewNote}
                onTogglePin={handleTogglePin}
                onToggleArchive={handleToggleArchive}
                onDeleteNote={handleMoveToTrash}
                onRestoreNote={handleRestoreNote}
                onPermanentlyDeleteNote={handlePermanentlyDeleteNote}
                onCopyNote={handleCopyNote}
                activeFilter={activeFilter}
                onTagClick={handleTagClick}
                onRemoveTagFromNote={handleRemoveTagFromNote}
                onEmptyTrash={handleEmptyTrash}
              />
            </div>
          </main>
        </div>
      </div>

      {activeFilter !== 'trash' && activeFilter !== 'archived' && (
        <MobileFab onNewNote={handleNewNote} onNewVoiceNote={handleNewVoiceNote} onNewPlan={handleNewPlan} />
      )}

      <React.Suspense fallback={null}>
        {isViewerOpen && (
            <NoteViewer
                isOpen={isViewerOpen}
                setIsOpen={setIsViewerOpen}
                note={viewingNote}
                onEdit={handleStartEditing}
                onChecklistItemToggle={handleChecklistItemToggle}
            />
        )}
        {isEditorOpen && (
            <NoteEditor
                isOpen={isEditorOpen}
                setIsOpen={setIsEditorOpen}
                note={editingNote}
                onSave={handleSaveNote}
                isSaving={isSaving}
            />
        )}
        {isTranscriberOpen && (
            <AudioTranscriber
                open={isTranscriberOpen}
                setOpen={setIsTranscriberOpen}
                onTranscriptionComplete={handleTranscriptionToNewNote}
            />
        )}
        {isPlannerOpen && (
            <GoalPlanner
                open={isPlannerOpen}
                setOpen={setIsPlannerOpen}
                onSavePlan={handleSavePlan}
            />
        )}
      </React.Suspense>

      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && handleCancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteConfirmation?.type === 'permanent'
                ? 'Are you absolutely sure?'
                : 'Move Note to Trash?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation?.type === 'permanent'
                ? 'This action cannot be undone. This will permanently delete this note.'
                : 'This will move the note to the trash. You can restore it later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(deleteConfirmation?.type === 'permanent' && buttonVariants({ variant: 'destructive' }))}
              onClick={handleConfirmDelete}
            >
              {deleteConfirmation?.type === 'permanent' ? 'Delete Permanently' : 'Move to Trash'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isEmptryTrashConfirmOpen} onOpenChange={setIsEmptyTrashConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all notes in the trash. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={handleConfirmEmptyTrash}
            >
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
