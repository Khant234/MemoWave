
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GripVertical, ArrowDown, Minus, ArrowUp, Flag } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@/components/ui/tooltip";

type KanbanCardProps = {
  note: Note;
  onClick: (note: Note) => void;
};

const priorityIcons: Record<Note['priority'], React.ReactNode> = {
    high: <Flag className="h-4 w-4 text-red-500 fill-red-500" />,
    medium: <Flag className="h-4 w-4 text-yellow-500 fill-yellow-500" />,
    low: <Flag className="h-4 w-4 text-green-500 fill-green-500" />,
    none: null,
};

const priorityTooltips: Record<Note['priority'], string> = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
    none: "No Priority",
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
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        onClick={() => onClick(note)}
        className={cn(
            "mb-4 cursor-pointer hover:shadow-lg transition-shadow",
            isDragging && "shadow-2xl ring-2 ring-primary"
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between p-3">
          <CardTitle className="text-base font-medium line-clamp-3 pr-2">{note.title || "Untitled"}</CardTitle>
          <div
            className="p-1 cursor-grab touch-none"
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                {note.priority !== 'none' && (
                    <Tooltip>
                        <TooltipTrigger>{priorityIcons[note.priority]}</TooltipTrigger>
                        <TooltipContent>
                            <p>{priorityTooltips[note.priority]}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
             </div>
             <div className="flex flex-wrap gap-1 justify-end">
                {note.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
