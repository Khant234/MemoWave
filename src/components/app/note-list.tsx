
"use client";

import { type Note } from "@/lib/types";
import { NoteCard } from "./note-card";
import { cn } from "@/lib/utils";

type NoteListProps = {
  notes: Note[];
  layout: "grid" | "list";
  onViewNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onPermanentlyDeleteNote: (noteId: string) => void;
  activeFilter: "all" | "archived" | "trash";
};

export function NoteList({
  notes,
  layout,
  onViewNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  activeFilter,
}: NoteListProps) {
  if (notes.length === 0) {
    const messages = {
      all: {
        title: "No Notes Yet",
        description: "Click on \"New Note\" to start weaving your thoughts.",
      },
      archived: {
        title: "No Archived Notes",
        description: "Your archived notes will appear here.",
      },
      trash: {
        title: "Trash is Empty",
        description: "Notes you delete will be moved to the trash.",
      },
    };
    const message = messages[activeFilter];
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-semibold mb-2 font-headline">{message.title}</h2>
        <p className="text-muted-foreground">
          {message.description}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "transition-all duration-300",
        layout === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          : "flex flex-col gap-4"
      )}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onViewNote={onViewNote}
          onTogglePin={onTogglePin}
          onToggleArchive={onToggleArchive}
          onDeleteNote={onDeleteNote}
          onRestoreNote={onRestoreNote}
          onPermanentlyDeleteNote={onPermanentlyDeleteNote}
        />
      ))}
    </div>
  );
}
