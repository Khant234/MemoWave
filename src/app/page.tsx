
"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { NoteList } from "@/components/app/note-list";
import { NoteViewer } from "@/components/app/note-viewer";
import { NoteEditor } from "@/components/app/note-editor";
import { type Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";
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

export default function Home() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
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

  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    noteId: string;
    type: 'trash' | 'permanent';
  } | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);

  const notesCollectionRef = collection(db, "notes");

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const data = await getDocs(query(notesCollectionRef, orderBy("updatedAt", "desc")));
      const fetchedNotes = data.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as Note;
      });
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Failed to fetch notes from Firestore", error);
      toast({
        title: "Error fetching notes",
        description: "Could not load notes. Please check your Firebase configuration and internet connection.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useHotkeys("n", () => handleNewNote(), { preventDefault: true });

  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
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


  const handleSaveNote = async (noteToSave: Note) => {
    setIsEditorOpen(false);
    
    const isExisting = notes.some((n) => n.id === noteToSave.id);

    try {
      if (isExisting) {
        const noteRef = doc(db, "notes", noteToSave.id);
        const {id, ...noteData} = noteToSave;
        await updateDoc(noteRef, { ...noteData });
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n.id === noteToSave.id ? noteToSave : n))
        );
      } else {
        const { id, ...noteData } = noteToSave;
        const docRef = await addDoc(notesCollectionRef, noteData);
        setNotes((prevNotes) => [{ ...noteToSave, id: docRef.id }, ...prevNotes]);
      }
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
      fetchNotes(); // Refetch to sync state with db
    } finally {
        setEditingNote(null);
    }
  };
  
  const updateNoteField = async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    // Optimistic UI update for both notes list and viewing note
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === noteId ? { ...n, ...updates } : n))
    );
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
      fetchNotes(); // Revert and refetch
    }
  };

  const handleChecklistItemToggle = (noteId: string, checklistItemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
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

    const { id, isPinned, createdAt, updatedAt, ...restOfNote } = noteToCopy;

    const newNoteData = {
      ...restOfNote,
      title: `Copy of ${noteToCopy.title || 'Untitled'}`,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const docRef = await addDoc(notesCollectionRef, newNoteData);
      const newNote = { ...newNoteData, id: docRef.id } as Note;
      setNotes((prevNotes) => [newNote, ...prevNotes]);
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
    setActiveFilter("all");
    setSearchTerm(tag);
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
      const originalNotes = [...notes];
      setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
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
        setNotes(originalNotes);
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

  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((note) => {
      if (!note.isTrashed) {
        note.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [notes]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-secondary/40">
      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        layout={layout}
        setLayout={setLayout}
        onNewNote={handleNewNote}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
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
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-7xl">
            <NoteList
              notes={filteredNotes}
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
            />
          </div>
        </main>
      </div>

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
      <Button
        onClick={handleNewNote}
        size="icon"
        className="sm:hidden fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">New Note</span>
      </Button>
    </div>
  );
}
