
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
import { NoteEditor } from "@/components/app/note-editor";
import { type Note } from "@/lib/types";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "archived" | "trash">(
    "all"
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const { toast } = useToast();
  const [deleteConfirmation, setDeleteConfirmation] = React.useState<{
    noteId: string;
    type: 'trash' | 'permanent';
  } | null>(null);


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

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteToSave: Note) => {
    setIsEditorOpen(false);
    
    const isExisting = notes.some((n) => n.id === noteToSave.id);

    try {
      if (isExisting) {
        const noteRef = doc(db, "notes", noteToSave.id);
        await updateDoc(noteRef, noteToSave);
        setNotes((prevNotes) =>
          prevNotes.map((n) => (n.id === noteToSave.id ? noteToSave : n))
        );
      } else {
        const { id, ...noteData } = noteToSave;
        const docRef = await addDoc(notesCollectionRef, noteData);
        setNotes((prevNotes) => [{ ...noteToSave, id: docRef.id }, ...prevNotes]);
      }
       toast({
          title: "Note Saved",
          description: `Your note "${noteToSave.title || 'Untitled'}" has been saved.`,
      });
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
    // Optimistic UI update
    setNotes((prevNotes) =>
      prevNotes.map((n) => (n.id === noteId ? { ...n, ...updates } : n))
    );

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

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-muted/40 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <AppSidebar
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
      />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 w-full">
        <AppHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          layout={layout}
          setLayout={setLayout}
          onNewNote={handleNewNote}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
        <main className="p-4 sm:px-6 sm:py-0 md:p-6 flex-1">
          <NoteList
            notes={filteredNotes}
            layout={layout}
            onEditNote={handleEditNote}
            onTogglePin={handleTogglePin}
            onToggleArchive={handleToggleArchive}
            onDeleteNote={handleMoveToTrash}
            onRestoreNote={handleRestoreNote}
            onPermanentlyDeleteNote={handlePermanentlyDeleteNote}
            activeFilter={activeFilter}
          />
        </main>
      </div>
      <NoteEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        note={editingNote}
        onSave={handleSaveNote}
      />
      <Toaster />
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
    </div>
  );
}
