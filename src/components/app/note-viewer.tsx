
"use client";

import * as React from "react";
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Edit, CheckSquare, Square, Music } from "lucide-react";

type NoteViewerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onEdit: (note: Note) => void;
  onChecklistItemToggle: (noteId: string, checklistItemId: string) => void;
};

export function NoteViewer({ isOpen, setIsOpen, note, onEdit, onChecklistItemToggle }: NoteViewerProps) {
  if (!note) return null;

  const handleEditClick = () => {
    onEdit(note);
  };
  
  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0" style={{ borderLeft: `4px solid ${note.color}`}}>
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-headline text-2xl">{note.title || 'Untitled Note'}</SheetTitle>
          <SheetDescription>
            Last updated on {formattedDate(note.updatedAt)}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow px-6">
          <div className="space-y-6 pb-6">
            {note.imageUrl && (
              <div className="relative">
                <Image width={600} height={400} src={note.imageUrl} alt="Note attachment" className="rounded-lg w-full h-auto object-cover" />
              </div>
            )}
            
            <p className="whitespace-pre-wrap text-base leading-relaxed">{note.content}</p>

            {note.audioUrl && (
                <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <Music className="h-4 w-4" />
                        Attached Audio
                    </div>
                    <audio controls src={note.audioUrl} className="w-full" />
                </div>
            )}

            {note.checklist && note.checklist.length > 0 && (
              <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="text-sm font-medium">Checklist</h3>
                  <div className="space-y-2">
                      {note.checklist.map(item => (
                          <button
                            key={item.id}
                            onClick={() => onChecklistItemToggle(note.id, item.id)}
                            className="flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-accent"
                          >
                            {item.completed ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-primary" /> : <Square className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                            <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</span>
                          </button>
                      ))}
                  </div>
              </div>
            )}

            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {note.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 bg-background border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
                {note.isDraft && <Badge variant="outline">Draft</Badge>}
                {note.isPinned && <Badge variant="default">Pinned</Badge>}
                {note.isArchived && <Badge variant="secondary">Archived</Badge>}
            </div>
            <div className="flex gap-2">
                <SheetClose asChild>
                    <Button variant="outline">Close</Button>
                </SheetClose>
                <Button onClick={handleEditClick}>
                    <Edit className="mr-2 h-4 w-4"/>
                    Edit
                </Button>
            </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
