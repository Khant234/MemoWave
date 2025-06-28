
"use client";

import { type Note } from "@/lib/types";
import { NoteCard } from "./note-card";
import { cn } from "@/lib/utils";
import { NotepadText, Archive, Trash2 } from "lucide-react";

type NoteListProps = {
  notes: Note[];
  layout: "grid" | "list";
  onViewNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onPermanentlyDeleteNote: (noteId: string) => void;
  onCopyNote: (noteId: string) => void;
  onTagClick: (tag: string) => void;
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
  onCopyNote,
  onTagClick,
  activeFilter,
}: NoteListProps) {
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

  const pinnedNotes = activeFilter === "all" ? notes.filter((note) => note.isPinned) : [];
  const otherNotes = activeFilter === "all" ? notes.filter((note) => !note.isPinned) : notes;

  const hasPinnedNotes = pinnedNotes.length > 0;

  const noteGridClasses = cn(
    "transition-all duration-300",
    layout === "grid"
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      : "flex flex-col gap-4"
  );
  
  const renderNoteList = (notesToRender: Note[]) => (
    <div className={noteGridClasses}>
      {notesToRender.map((note) => (
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
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      {hasPinnedNotes && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Pinned
          </h2>
          {renderNoteList(pinnedNotes)}
        </div>
      )}

      {otherNotes.length > 0 && (
        <div className="space-y-4">
          {hasPinnedNotes && (
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Others
            </h2>
          )}
          {renderNoteList(otherNotes)}
        </div>
      )}
    </div>
  );
}
