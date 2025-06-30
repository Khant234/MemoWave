
"use client";

import { type Note } from "@/lib/types";
import { NoteCard } from "./note-card";
import { cn } from "@/lib/utils";
import { NotepadText, Archive, Trash2 } from "lucide-react";
import { NoteCardSkeleton } from "./note-card-skeleton";
import { Button } from "../ui/button";

type NoteListProps = {
  notes: Note[];
  layout: "grid" | "list";
  isLoading: boolean;
  onViewNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onPermanentlyDeleteNote: (noteId: string) => void;
  onCopyNote: (noteId: string) => void;
  onTagClick: (tag: string) => void;
  onRemoveTagFromNote: (noteId: string, tag: string) => void;
  onEmptyTrash: () => void;
  activeFilter: "all" | "archived" | "trash";
};

export function NoteList({
  notes,
  layout,
  isLoading,
  onViewNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onCopyNote,
  onTagClick,
  onRemoveTagFromNote,
  onEmptyTrash,
  activeFilter,
}: NoteListProps) {

  const gridClasses = cn(
    "grid gap-4",
    layout === "grid"
      ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : "grid-cols-1"
  );
  
  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 10 }).map((_, index) => (
          <NoteCardSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (notes.length === 0) {
    const messages = {
      all: {
        icon: NotepadText,
        title: "No Notes Yet",
        description: "Click on \"New Note\" to start weaving your thoughts.",
      },
      archived: {
        icon: Archive,
        title: "No Archived Notes",
        description: "Your archived notes will appear here.",
      },
      trash: {
        icon: Trash2,
        title: "Trash is Empty",
        description: "Notes you delete will be moved to the trash.",
      },
    };
    const { icon: Icon, title, description } = messages[activeFilter];
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg bg-background border-2 border-dashed">
        <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
            <Icon className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 font-headline">{title}</h2>
        <p className="text-muted-foreground max-w-sm">
          {description}
        </p>
      </div>
    );
  }

  const renderNoteCard = (note: Note) => (
    <NoteCard
      key={note.id}
      note={note}
      onViewNote={onViewNote}
      onTogglePin={onTogglePin}
      onToggleArchive={onToggleArchive}
      onDeleteNote={onDeleteNote}
      onRestoreNote={onRestoreNote}
      onPermanentlyDeleteNote={onPermanentlyDeleteNote}
      onCopyNote={onCopyNote}
      onTagClick={onTagClick}
      onRemoveTagFromNote={onRemoveTagFromNote}
    />
  );

  return (
    <>
      {activeFilter === 'trash' && notes.length > 0 && (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
            <p>
                Notes in the trash are not recoverable after permanent deletion.
            </p>
            <Button
                variant="destructive"
                size="sm"
                onClick={onEmptyTrash}
                className="flex-shrink-0"
            >
                Empty Trash Now
            </Button>
        </div>
      )}
      <div
        className={gridClasses}
      >
        {notes.map(renderNoteCard)}
      </div>
    </>
  );
}
