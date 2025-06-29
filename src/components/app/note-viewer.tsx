
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
import { Edit, CheckSquare, Square, Music, Download } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChecklistCompleteMessage } from "./checklist-complete";

type NoteViewerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onEdit: (note: Note) => void;
  onChecklistItemToggle: (noteId: string, checklistItemId: string) => void;
};

// Helper component to render text with clickable links
const LinkifiedText = ({ text }: { text: string }) => {
  // Regex to find URLs. \S+ matches non-whitespace characters.
  const urlRegex = /(https?:\/\/\S+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <a
              key={index}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline decoration-primary/50 underline-offset-4 transition-colors hover:text-primary/80 hover:decoration-primary/80"
              onClick={(e) => e.stopPropagation()} // Prevent any parent onClick handlers from firing
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
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

  const checklistExists = note.checklist && note.checklist.length > 0;
  
  const sortedChecklist = checklistExists
    ? [...note.checklist].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
      })
    : [];

  const completedItems = checklistExists
    ? note.checklist.filter((item) => item.completed).length
    : 0;
  const totalItems = checklistExists ? note.checklist.length : 0;
  const checklistProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
  const allItemsComplete = checklistExists && totalItems > 0 && completedItems === totalItems;


  const audioFileExtension = React.useMemo(() => {
    if (!note.audioUrl) return 'wav';
    return note.audioUrl.match(/data:audio\/(.*?);/)?.[1] || 'wav';
  }, [note.audioUrl]);

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
            
            <div className="whitespace-pre-wrap text-base leading-relaxed">
              <LinkifiedText text={note.content} />
            </div>

            {note.audioUrl && (
                <div className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Music className="h-4 w-4" />
                            <span>Attached Audio</span>
                        </div>
                        <a href={note.audioUrl} download={`note-audio-${note.id}.${audioFileExtension}`}>
                            <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download audio</span>
                            </Button>
                        </a>
                    </div>
                    <audio controls src={note.audioUrl} className="w-full" />
                </div>
            )}

            {checklistExists && (
              <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Checklist</h3>
                    <span className="text-xs text-muted-foreground">
                      {completedItems}/{totalItems} completed
                    </span>
                  </div>
                  <Progress value={checklistProgress} className="h-2" />
                  <div className="space-y-2">
                      {sortedChecklist.map(item => (
                          <button
                            key={item.id}
                            onClick={() => onChecklistItemToggle(note.id, item.id)}
                            className="flex w-full items-center gap-3 rounded-md p-1 text-left transition-colors hover:bg-secondary"
                          >
                            {item.completed ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-primary" /> : <Square className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                            <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</span>
                          </button>
                      ))}
                  </div>
                  {allItemsComplete && <ChecklistCompleteMessage />}
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
