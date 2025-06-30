
"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./kanban-card";
import { type Note, type NoteStatus } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  id: NoteStatus;
  title: string;
  notes: Note[];
  onCardClick: (note: Note) => void;
};

export function KanbanColumn({ id, title, notes, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-[80vw] max-w-[300px] sm:w-80 sm:max-w-none flex-shrink-0">
      <h2 className="text-lg font-semibold mb-4 px-2">{title} ({notes.length})</h2>
      <ScrollArea className={cn(
          "flex-1 bg-secondary rounded-lg p-2 transition-colors",
          isOver && "bg-primary/10"
        )}
      >
        <SortableContext
          id={id}
          items={notes.map(n => n.id)}
          strategy={verticalListSortingStrategy}
        >
          <div ref={setNodeRef} className="min-h-[200px] space-y-4">
            {notes.map(note => (
              <KanbanCard key={note.id} note={note} onClick={onCardClick} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
