
"use client";

import * as React from "react";
import Image from "next/image";
import { type Note } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Archive,
  Trash2,
  Pin,
  PinOff,
  Undo,
  MoreVertical,
  Copy,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NoteCardProps = {
  note: Note;
  onViewNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onPermanentlyDeleteNote: (noteId: string) => void;
  onCopyNote: (noteId: string) => void;
  onTagClick: (tag: string) => void;
  onRemoveTagFromNote: (noteId: string, tag: string) => void;
};

export function NoteCard({
  note,
  onViewNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onCopyNote,
  onTagClick,
  onRemoveTagFromNote,
}: NoteCardProps) {
  const [formattedDate, setFormattedDate] = React.useState("");

  React.useEffect(() => {
    // Client-side effect to prevent hydration mismatch
    setFormattedDate(new Date(note.updatedAt).toLocaleDateString());
  }, [note.updatedAt]);
  
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    onTogglePin(note.id);
  };

  return (
    <Card
      onClick={() => !note.isTrashed && onViewNote(note)}
      className={cn(
        "cursor-pointer hover:shadow-lg transition-shadow duration-200 overflow-hidden border-transparent shadow-md",
        note.isPinned && "border-primary/50 bg-primary/10",
        note.isTrashed && "opacity-70 bg-muted/50 cursor-default"
      )}
      style={{ borderTop: `4px solid ${note.color}` }}
    >
      <CardHeader className="relative pb-2">
        <CardTitle className="pr-12 text-lg font-headline">
          {note.title || "Untitled Note"}
        </CardTitle>
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {!note.isTrashed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handlePinClick}
            >
              {note.isPinned ? (
                <Pin className="h-4 w-4 text-primary fill-primary" />
              ) : (
                <Pin className="h-4 w-4" />
              )}
              <span className="sr-only">
                {note.isPinned ? "Unpin note" : "Pin note"}
              </span>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={(e) => e.stopPropagation()}
            >
              {note.isTrashed ? (
                <>
                  <DropdownMenuItem onClick={() => onRestoreNote(note.id)}>
                    <Undo className="mr-2 h-4 w-4" />
                    <span>Restore</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onPermanentlyDeleteNote(note.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Permanently</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => onCopyNote(note.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    <span>Make a copy</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleArchive(note.id)}>
                    <Archive className="mr-2 h-4 w-4" />
                    <span>{note.isArchived ? "Unarchive" : "Archive"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    onClick={() => onDeleteNote(note.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Move to Trash</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-2 px-6 pb-4">
        {note.imageUrl && (
          <div className="relative mb-4 aspect-video w-full rounded-md overflow-hidden">
            <Image
              src={note.imageUrl}
              alt={note.title || 'Note image'}
              fill
              className="object-cover"
              data-ai-hint="note image"
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground line-clamp-4">
          {note.content}
        </p>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 pt-0 px-6 pb-4">
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
            >
              <span
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onTagClick(tag);
                }}
              >
                {tag}
              </span>
              {!note.isTrashed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTagFromNote(note.id, tag);
                  }}
                  className="ml-1 rounded-full p-0.5 hover:bg-destructive/20"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
        <div className="flex justify-between w-full items-center pt-2">
            <p className="text-xs text-muted-foreground">
              {formattedDate}
            </p>
            {note.isDraft && (
                <Badge variant="outline">Draft</Badge>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
