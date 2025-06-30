
"use client";

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import { GripVertical, Flag, CheckSquare, CalendarClock } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
  } from "@/components/ui/tooltip";

type KanbanCardContentProps = {
  note: Note;
  listeners?: any;
  isOverlay?: boolean;
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

export function KanbanCardContent({ note, listeners, isOverlay }: KanbanCardContentProps) {
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
    
  const checklistProgress = note.checklist?.length > 0
    ? `${note.checklist.filter(i => i.completed).length}/${note.checklist.length}`
    : '';

  return (
    <Card
      className={cn(
          "bg-card hover:shadow-lg transition-shadow duration-200",
          isOverlay ? "shadow-2xl ring-2 ring-primary cursor-grabbing" : "cursor-pointer"
      )}
      style={{ borderLeft: `4px solid ${note.color}` }}
    >
      <CardHeader className="flex flex-row items-start justify-between p-3">
        <CardTitle className="text-sm font-medium line-clamp-3 pr-2">{note.title || "Untitled"}</CardTitle>
        <div
          className="p-1 cursor-grab touch-none -mr-2 -mt-1"
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
                {note.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5">{tag}</Badge>
                ))}
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
              {checklistProgress && (
                  <Tooltip>
                    <TooltipTrigger className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        <span>{checklistProgress}</span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Checklist progress</p>
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
