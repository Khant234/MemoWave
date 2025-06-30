
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
import { NoteViewer } from "@/components/app/note-viewer";
import { NoteEditor } from "@/components/app/note-editor";
import { type Note, type NoteVersion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
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
import { AudioTranscriber } from "@/components/app/audio-transcriber";
import { generateTitle } from "@/ai/flows/title-generation";
import { NOTE_COLORS } from "@/lib/data";
import { MobileFab } from "@/components/app/mobile-fab";

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


  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    noteId: string;
    type: 'trash' | 'permanent';
  } | null>(null);
  const [isEmptryTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = React.useState(false);

  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { recordTaskCompletion } = useGamification();


  const notesCollectionRef = collection(db, "notes");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, notes]);
  
  useHotkeys("n", () => handleNewNote(), { preventDefault: true });

  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleNewVoiceNote = () => {
    setIsTranscriberOpen(true);
  };
  
  const handleViewNote = (note: Note) => {
    setViewingNote(note);
    setIsViewerOpen(true);
  };

  const handleStartEditing = (note: Note) => {
    setIsViewerOpen(false); // Close viewer
    setEditingNote(note);   // Set note to edit
    setIsEditorOpen(true);  // Open editor
  };

  const handleTranscriptionToNewNote = async (transcription: string) => {
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

      const newNoteData = {
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
  };


  const handleSaveNote = async (noteToSave: Note) => {
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
            newHistory = newHistory.slice(0, 20); // Limit history to 20 entries
        }

        const noteRef = doc(db, "notes", noteToSave.id);
        const {id, ...noteData} = noteToSave;
        const finalNoteData = { ...noteData, history: newHistory };
        await updateDoc(noteRef, finalNoteData);

      } else {
        const { id, ...noteData } = noteToSave;
        const finalNoteData = { ...noteData, history: [] }; // New notes start with empty history
        const docRef = await addDoc(notesCollectionRef, finalNoteData);
        // No need to update state here, onSnapshot will do it
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
  };
  
  const updateNoteField = async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    // Optimistic UI update for viewing note, main list is updated by real-time listener
    if (viewingNote && viewingNote.id === noteId) {
        setViewingNote(prev => prev ? { ...prev, ...updates } : null);
    }

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
      // The real-time listener will automatically revert the state on failure.
    }
  };

  const handleChecklistItemToggle = (noteId: string, checklistItemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      recordTaskCompletion(note, checklistItemId);
      
      const updatedChecklist = note.checklist.map((item) =>
        item.id === checklistItemId
          ? { ...item, completed: !item.completed }
          : item
      );
      updateNoteField(noteId, { checklist: updatedChecklist });
    }
  };

  const handleTogglePin = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      updateNoteField(noteId, { isPinned: !note.isPinned });
    }
  };

  const handleToggleArchive = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      updateNoteField(noteId, { isArchived: !note.isArchived, isPinned: false });
    }
  };

  const handleMoveToTrash = (noteId: string) => {
    setDeleteConfirmation({ noteId, type: 'trash' });
  };

  const handleRestoreNote = (noteId: string) => {
    updateNoteField(noteId, { isTrashed: false });
  };

  const handlePermanentlyDeleteNote = (noteId: string) => {
    setDeleteConfirmation({ noteId, type: 'permanent' });
  };

  const handleEmptyTrash = () => {
    setIsEmptyTrashConfirmOpen(true);
  };

  const handleConfirmEmptyTrash = async () => {
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
  };

  const handleCopyNote = async (noteId: string) => {
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
    };

    try {
      const docRef = await addDoc(notesCollectionRef, newNoteData);
      // No need to update state, onSnapshot will handle it.
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
  };

  const handleTagClick = (tag: string) => {
    router.push(`/?q=${tag}`);
  };
  
  const handleRemoveTagFromNote = async (noteId: string, tagToRemove: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      const updatedTags = note.tags.filter((tag) => tag !== tagToRemove);
      await updateNoteField(noteId, { tags: updatedTags });
      toast({
        title: "Tag removed",
        description: `The tag "${tagToRemove}" has been removed from the note.`,
      });
    }
  };

  const handleConfirmDelete = async () => {
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
  };
  
  const handleCancelDelete = () => {
    setDeleteConfirmation(null);
  };


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
        
        const matchesSearch =
          searchTerm.trim() === "" ||
          note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          note.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <div className="flex h-screen w-full flex-col bg-secondary">
      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        layout={layout}
        setLayout={setLayout}
        onNewNote={handleNewNote}
        onNewVoiceNote={handleNewVoiceNote}
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
              notes={filteredNotes}
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

      {activeFilter !== 'trash' && activeFilter !== 'archived' && (
        <MobileFab onNewNote={handleNewNote} onNewVoiceNote={handleNewVoiceNote} />
      )}

      <NoteViewer
        isOpen={isViewerOpen}
        setIsOpen={setIsViewerOpen}
        note={viewingNote}
        onEdit={handleStartEditing}
        onChecklistItemToggle={handleChecklistItemToggle}
      />
      <NoteEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        note={editingNote}
        onSave={handleSaveNote}
        isSaving={isSaving}
      />
      <AudioTranscriber
        open={isTranscriberOpen}
        setOpen={setIsTranscriberOpen}
        onTranscriptionComplete={handleTranscriptionToNewNote}
      />
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
    </div>
  );
}
