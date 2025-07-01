
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCardContent } from "./kanban-card-content";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";

type KanbanCardProps = {
  note: Note;
  onClick: (note: Note) => void;
};

export function KanbanCard({ note, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        onClick={() => onClick(note)}
        className={cn(isDragging && "opacity-30")}
    >
        <KanbanCardContent note={note} dragHandleListeners={listeners} />
    </div>
  );
}
