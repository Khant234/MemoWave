
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
import { Edit, CheckSquare, Square, Music, Download, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChecklistCompleteMessage } from "./checklist-complete";
import { useClickSound } from "@/hooks/use-click-sound";

type NoteViewerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onEdit: (note: Note) => void;
  onChecklistItemToggle: (noteId: string, checklistItemId: string) => void;
};

const formatTime = (time24: string | null | undefined): string => {
    if (!time24) return '';
    const [h, m] = time24.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
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
  const [formattedUpdateDate, setFormattedUpdateDate] = React.useState('');
  const playClickSound = useClickSound();
  
  const audioFileExtension = React.useMemo(() => {
    if (!note?.audioUrl) return 'wav';
    return note.audioUrl.match(/data:audio\/(.*?);/)?.[1] || 'wav';
  }, [note?.audioUrl]);
  
  React.useEffect(() => {
    if (note) {
      setFormattedUpdateDate(
        new Date(note.updatedAt).toLocaleString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    }
  }, [note]);

  if (!note) return null;

  const handleEditClick = () => {
    playClickSound();
    onEdit(note);
  };
  
  const handleChecklistToggle = (itemId: string) => {
    playClickSound();
    onChecklistItemToggle(note.id, itemId);
  };

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


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="sm:max-w-2xl w-full flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-headline text-2xl">{note.title || 'Untitled Note'}</SheetTitle>
          <SheetDescription className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <span>Last updated on {formattedUpdateDate}</span>
            {note.startTime && (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Scheduled: {formatTime(note.startTime)}{note.endTime ? ` - ${formatTime(note.endTime)}` : ''}
              </span>
            )}
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
                            onClick={() => handleChecklistToggle(item.id)}
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
                    <Button variant="outline" onClick={playClickSound}>Close</Button>
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
