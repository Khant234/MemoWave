
"use client";

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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type NoteCardProps = {
  note: Note;
  onEditNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
};

export function NoteCard({
  note,
  onEditNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
}: NoteCardProps) {
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(note.id);
  };

  return (
    <Card
      onClick={() => onEditNote(note)}
      className={cn(
        "cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col h-full overflow-hidden",
        note.isPinned && "border-primary/50"
      )}
      style={{ borderTop: `4px solid ${note.color}` }}
    >
      <CardHeader className="relative pb-2">
        <CardTitle className="pr-12 text-lg font-headline">
          {note.title}
        </CardTitle>
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={handlePinClick}
          >
            {note.isPinned ? (
              <Pin className="h-4 w-4 text-primary" />
            ) : (
              <Pin className="h-4 w-4" />
            )}
            <span className="sr-only">
              {note.isPinned ? "Unpin note" : "Pin note"}
            </span>
          </Button>
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
              <DropdownMenuItem onClick={() => onToggleArchive(note.id)}>
                <Archive className="mr-2 h-4 w-4" />
                <span>{note.isArchived ? "Unarchive" : "Archive"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDeleteNote(note.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2 px-6 pb-4">
        {note.imageUrl && (
          <div className="relative mb-4 aspect-video w-full">
            <Image
              src={note.imageUrl}
              alt={note.title}
              fill
              className="rounded-md object-cover"
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
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground pt-2">
          {new Date(note.updatedAt).toLocaleDateString()}
        </p>
      </CardFooter>
    </Card>
  );
}
