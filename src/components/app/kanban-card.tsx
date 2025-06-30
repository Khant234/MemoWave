
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCardContent } from "./kanban-card-content";
import { type Note } from "@/lib/types";

type KanbanCardProps = {
  note: Note;
  onClick: (note: Note) => void;
  isOverlay?: boolean;
};

export function KanbanCard({ note, onClick, isOverlay }: KanbanCardProps) {
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
    opacity: isDragging ? 0 : 1,
  };
  
  if (isOverlay) {
    return <KanbanCardContent note={note} isOverlay />;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={() => onClick(note)}>
        <KanbanCardContent note={note} />
    </div>
  );
}
