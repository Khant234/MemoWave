
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckSquare, Square, Edit, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ChecklistCompleteMessage } from "./checklist-complete";
import { useClickSound } from "@/hooks/use-click-sound";
import { ScrollArea } from "@/components/ui/scroll-area";

type ChecklistViewerProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  note: Note | null;
  onChecklistItemToggle: (noteId: string, checklistItemId: string) => void;
  onEditNote: (note: Note) => void;
  onViewFullNote: (note: Note) => void;
};

export function ChecklistViewer({ isOpen, setIsOpen, note, onChecklistItemToggle, onEditNote, onViewFullNote }: ChecklistViewerProps) {
  const playClickSound = useClickSound();
  
  if (!note) return null;

  const handleEditClick = () => {
    playClickSound();
    onEditNote(note);
    setIsOpen(false);
  };

  const handleViewFullNoteClick = () => {
    playClickSound();
    onViewFullNote(note);
    setIsOpen(false);
  }
  
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">{note.title || 'Untitled Note'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-4">
                {checklistExists ? (
                <>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                        {completedItems}/{totalItems}
                        </span>
                    </div>
                    <Progress value={checklistProgress} className="h-2" />
                    <div className="space-y-2 pt-2">
                        {sortedChecklist.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleChecklistToggle(item.id)}
                                className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-secondary"
                            >
                                {item.completed ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-primary" /> : <Square className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                                <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</span>
                            </button>
                        ))}
                    </div>
                    {allItemsComplete && <ChecklistCompleteMessage />}
                </>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>This note has no checklist items.</p>
                    </div>
                )}
            </div>
        </ScrollArea>

        <DialogFooter className="justify-between sm:justify-between w-full">
            <Button variant="ghost" onClick={handleViewFullNoteClick}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Full Note
            </Button>
            <Button onClick={handleEditClick}>
                <Edit className="mr-2 h-4 w-4"/>
                Edit Note
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
