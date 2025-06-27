"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { NoteList } from "@/components/app/note-list";
import { NoteEditor } from "@/components/app/note-editor";
import { type Note } from "@/lib/types";
import { DUMMY_NOTES } from "@/lib/data";
import { Toaster } from "@/components/ui/toaster";

export default function Home() {
  const [notes, setNotes] = React.useState<Note[]>(DUMMY_NOTES);
  const [activeFilter, setActiveFilter] = React.useState<"all" | "archived">(
    "all"
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [layout, setLayout] = React.useState<"grid" | "list">("grid");
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);

  useHotkeys("n", () => handleNewNote(), { preventDefault: true });

  const handleNewNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = (noteToSave: Note) => {
    setNotes((prevNotes) => {
      const isExisting = prevNotes.some((n) => n.id === noteToSave.id);
      if (isExisting) {
        return prevNotes.map((n) => (n.id === noteToSave.id ? noteToSave : n));
      } else {
        return [noteToSave, ...prevNotes];
      }
    });
    setIsEditorOpen(false);
  };

  const handleTogglePin = (noteId: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === noteId ? { ...n, isPinned: !n.isPinned } : n
      )
    );
  };

  const handleToggleArchive = (noteId: string) => {
    setNotes((prevNotes) =>
      prevNotes.map((n) =>
        n.id === noteId ? { ...n, isArchived: !n.isArchived } : n
      )
    );
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
  };

  const filteredNotes = React.useMemo(() => {
    return notes
      .filter((note) => {
        const matchesFilter =
          activeFilter === "all" ? !note.isArchived : note.isArchived;
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
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [notes, activeFilter, searchTerm]);

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
            onDeleteNote={handleDeleteNote}
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
    </div>
  );
}
