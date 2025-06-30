
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { type Note } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  id: string;
  title: string;
  notes: Note[];
  onCardClick: (note: Note) => void;
};

export function KanbanColumn({ id, title, notes, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-[80vw] max-w-[300px] sm:w-80 sm:max-w-none flex-shrink-0 h-full bg-secondary rounded-lg">
      <div className="p-3 flex-shrink-0 border-b-2 border-background/50">
        <h2 className="text-base font-semibold text-foreground flex items-center justify-between">
            <span>{title}</span>
            <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full">{notes.length}</span>
        </h2>
      </div>
      <ScrollArea
        className={cn(
          "flex-1 transition-colors",
          isOver && "bg-primary/10"
        )}
      >
        <SortableContext
          id={id}
          items={notes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef} className="min-h-full space-y-3 p-3">
            {notes.map(note => (
              <KanbanCard key={note.id} note={note} onClick={onCardClick} />
            ))}
            {notes.length === 0 && (
                <div className="flex items-center justify-center text-sm text-muted-foreground h-24 border-2 border-dashed border-muted-foreground/30 rounded-md">
                    <p>Drop tasks here</p>
                </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
