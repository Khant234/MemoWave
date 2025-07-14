

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
  Undo,
  MoreVertical,
  Copy,
  CheckSquare,
  Flag,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type NoteCardProps = {
  note: Note;
  onViewNote: (note: Note) => void;
  onTogglePin: (noteId: string) => void;
  onToggleArchive: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRestoreNote: (noteId: string) => void;
  onPermanentlyDeleteNote: (noteId:string) => void;
  onCopyNote: (noteId: string) => void;
};

const priorityIcons: Record<Note['priority'], React.ReactNode> = {
    high: <Flag className="h-4 w-4 text-red-500 fill-red-500/20" />,
    medium: <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500/20" />,
    low: <Flag className="h-4 w-4 text-green-500 fill-green-500/20" />,
    none: null,
};
const priorityTooltips: Record<Note['priority'], string> = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
    none: "No Priority",
};

const NoteCardComponent = ({
  note,
  onViewNote,
  onTogglePin,
  onToggleArchive,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onCopyNote,
}: NoteCardProps) => {
  const [formattedDate, setFormattedDate] = React.useState("");

  React.useEffect(() => {
    setFormattedDate(new Date(note.updatedAt).toLocaleDateString());
  }, [note.updatedAt]);
  
  const handlePinClick = React.useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePin(note.id);
  }, [onTogglePin, note.id]);

  const handleDropdownClick = React.useCallback((e: React.MouseEvent) => {
      e.stopPropagation();
  }, []);

  return (
    <Card
      onClick={() => !note.isTrashed && onViewNote(note)}
      className={cn(
        "group flex h-full flex-col overflow-hidden border transition-all duration-200 ease-in-out",
        "bg-card shadow-md hover:shadow-xl",
        note.isTrashed ? "opacity-60 bg-secondary/50 cursor-default" : "cursor-pointer",
        note.isPinned ? "border-primary" : "border-transparent",
        "border-l-4"
      )}
      style={{ borderLeftColor: note.isPinned ? 'hsl(var(--primary))' : note.color }}
    >
      <CardHeader className="relative px-4 pt-4 pb-2">
        <CardTitle className="pr-12 text-base font-bold font-headline line-clamp-2">
          {note.title || "Untitled Note"}
        </CardTitle>
        <div className="absolute top-2 right-2 flex items-center gap-0">
          {!note.isTrashed && (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={handlePinClick}
                    >
                    <Pin className={cn(
                        "h-4 w-4 transition-all duration-300 ease-in-out",
                        note.isPinned
                        ? "rotate-45 fill-primary text-primary"
                        : "text-muted-foreground group-hover:scale-125 group-hover:text-primary"
                    )} />
                    <span className="sr-only">
                        {note.isPinned ? "Unpin note" : "Pin note"}
                    </span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{note.isPinned ? "Unpin note" : "Pin note"}</p>
                </TooltipContent>
            </Tooltip>
          )}
          <DropdownMenu>
            <Tooltip>
                <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleDropdownClick}
                    >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                    </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                    <p>More options</p>
                </TooltipContent>
            </Tooltip>
            <DropdownMenuContent
              align="end"
              onClick={handleDropdownClick}
            >
              {note.isTrashed ? (
                <>
                  <DropdownMenuItem onClick={() => onRestoreNote(note.id)}>
                    <Undo className="mr-2 h-4 w-4" />
                    <span>Restore</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
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
                  <DropdownMenuSeparator />
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
      <CardContent className="flex-grow px-4 pb-4 min-h-[70px]">
        {note.imageUrl && (
          <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-md">
            <Image
              src={note.imageUrl}
              alt={note.title || 'Note image'}
              fill
              className="object-cover"
              data-ai-hint="note image"
            />
          </div>
        )}
        <div className="text-sm">
          {note.summary ? (
            <div className="space-y-1 rounded-md bg-primary/5 p-2 text-xs">
              <Badge variant="outline" className="border-primary/20 bg-transparent text-primary/90">
                <Sparkles className="mr-1.5 h-3 w-3" />
                AI Summary
              </Badge>
              <p className="font-medium italic text-primary/90 line-clamp-3">
                &ldquo;{note.summary}&rdquo;
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground line-clamp-3">
              {note.content}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 px-4 pb-3 pt-0">
        <div className="flex w-full items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              {formattedDate}
            </p>
            
            <div className="flex items-center gap-3 text-muted-foreground">
                {note.isPasswordProtected && (
                    <Tooltip>
                        <TooltipTrigger><Lock className="h-4 w-4" /></TooltipTrigger>
                        <TooltipContent>
                            <p>Password protected</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                {note.priority && note.priority !== 'none' && (
                    <Tooltip>
                        <TooltipTrigger>{priorityIcons[note.priority]}</TooltipTrigger>
                        <TooltipContent>
                            <p>{priorityTooltips[note.priority]}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                {note.checklist?.length > 0 && (
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 text-xs">
                        <CheckSquare className="h-4 w-4" />
                        <span>
                        {note.checklist.filter((item) => item.completed).length}/
                        {note.checklist.length}
                        </span>
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Checklist progress</p>
                    </TooltipContent>
                </Tooltip>
                )}
                {note.isDraft && (
                    <Badge variant="outline" className="text-xs">Draft</Badge>
                )}
            </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export const NoteCard = React.memo(NoteCardComponent);
