
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Flag, CheckSquare, CalendarClock, Square, GripVertical } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@/components/ui/tooltip";
import type { DraggableSyntheticListeners } from "@dnd-kit/core";

type KanbanCardContentProps = {
  note: Note;
  isOverlay?: boolean;
  dragHandleListeners?: DraggableSyntheticListeners;
};

const priorityIcons: Record<Note['priority'], React.ReactNode> = {
    high: <Flag className="h-4 w-4 text-red-500" />,
    medium: <Flag className="h-4 w-4 text-yellow-500" />,
    low: <Flag className="h-4 w-4 text-green-500" />,
    none: null,
};

const priorityTooltips: Record<Note['priority'], string> = {
    high: "High Priority",
    medium: "Medium Priority",
    low: "Low Priority",
    none: "No Priority",
};

const KanbanCardContentComponent = ({ note, isOverlay, dragHandleListeners }: KanbanCardContentProps) => {
  const [formattedDueDate, setFormattedDueDate] = React.useState('');

  React.useEffect(() => {
    if (note.dueDate) {
        setFormattedDueDate(new Date(note.dueDate).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric'
        }));
    } else {
        setFormattedDueDate('');
    }
  }, [note.dueDate]);
    
  const checklistItems = note.checklist?.slice(0, 4) || [];
  const hasMoreChecklistItems = (note.checklist?.length || 0) > 4;

  const handleDragHandleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className={cn(
          "bg-card hover:shadow-lg transition-shadow duration-200 border-none shadow-soft",
          isOverlay ? "shadow-2xl ring-2 ring-primary" : "cursor-pointer"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between p-3">
        <CardTitle className="text-sm font-medium line-clamp-3 pr-2">{note.title || "Untitled"}</CardTitle>
        {!isOverlay && (
            <div
                {...dragHandleListeners}
                onClick={handleDragHandleClick}
                className="flex-shrink-0 cursor-grab p-1 -mr-1 -mt-1 touch-none"
                aria-label="Drag handle"
            >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
        )}
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
                {note.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                ))}
            </div>
        )}

        {checklistItems.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {checklistItems.map(item => (
              <div key={item.id} className="flex items-start gap-2 text-xs">
                {item.completed ? (
                  <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                )}
                <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>
                  {item.text}
                </span>
              </div>
            ))}
            {hasMoreChecklistItems && (
              <div className="text-xs text-muted-foreground pl-6">...and {note.checklist.length - 4} more</div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center text-xs text-muted-foreground">
           <div className="flex items-center gap-3">
              {note.priority !== 'none' && (
                  <Tooltip>
                      <TooltipTrigger>{priorityIcons[note.priority]}</TooltipTrigger>
                      <TooltipContent>
                          <p>{priorityTooltips[note.priority]}</p>
                      </TooltipContent>
                  </Tooltip>
              )}
           </div>
           {formattedDueDate && (
               <Tooltip>
                <TooltipTrigger className="flex items-center gap-1">
                    <CalendarClock className="h-4 w-4" />
                    <span>{formattedDueDate}</span>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Due Date: {new Date(note.dueDate!).toLocaleDateString()}</p>
                </TooltipContent>
               </Tooltip>
           )}
        </div>
      </CardContent>
    </Card>
  );
}

export const KanbanCardContent = React.memo(KanbanCardContentComponent);
