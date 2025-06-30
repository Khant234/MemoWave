
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { KanbanCardContent } from "./kanban-card-content";
import { type Note } from "@/lib/types";

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
    zIndex: isDragging ? 10 : 'auto',
    opacity: isDragging ? 0 : 1, // Hide the original item
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
        <KanbanCardContent note={note} onClick={onClick} listeners={listeners} />
    </div>
  );
}
