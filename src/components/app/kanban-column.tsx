
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
    <div className="flex flex-col w-[80vw] max-w-[280px] sm:w-80 sm:max-w-none flex-shrink-0 h-full">
      <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 px-1 sm:px-2 flex-shrink-0 sticky top-0 bg-secondary z-10 py-2 -my-2 -mx-2 px-2">{title} ({notes.length})</h2>
      <ScrollArea
        className={cn(
          "flex-1 bg-secondary rounded-lg p-1 sm:p-2 transition-colors",
          isOver && "bg-primary/10"
        )}
      >
        <SortableContext
          id={id}
          items={notes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef} className="min-h-full space-y-2 sm:space-y-3">
            {notes.map(note => (
              <KanbanCard key={note.id} note={note} onClick={onCardClick} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
