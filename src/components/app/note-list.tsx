"use client";

import { type Note } from "@/lib/types";
import { NoteCard } from "./note-card";
import { cn } from "@/lib/utils";

type NoteListProps = {
  notes: Note[];
  layout: "grid" | "list";
  onEditNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
};

export function NoteList({
  notes,
  layout,
  onEditNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
}: NoteListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <h2 className="text-2xl font-semibold mb-2 font-headline">No Notes Yet</h2>
        <p className="text-muted-foreground">
          Click on "New Note" to start weaving your thoughts.
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
          onEditNote={onEditNote}
          onTogglePin={onTogglePin}
          onToggleArchive={onToggleArchive}
          onDeleteNote={onDeleteNote}
        />
      ))}
    </div>
  );
}
