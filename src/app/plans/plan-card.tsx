
"use client";

import * as React from "react";
import { type Note } from "@/lib/types";
import { type Plan } from "./page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Archive, MoreVertical, Trash2, ChevronDown, CheckSquare, Clock, ArchiveRestore } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { KANBAN_COLUMN_TITLES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type PlanCardProps = {
  plan: Plan;
  onArchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onViewNote: (note: Note) => void;
};

const NoteItem = ({ note, onClick }: { note: Note, onClick: () => void }) => (
  <div 
      className="flex items-center justify-between p-3 rounded-lg hover:bg-background cursor-pointer group"
      onClick={onClick}
  >
      <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: note.color }}></div>
          <div>
              <p className="font-semibold">{note.title}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  {note.dueDate && (
                      <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(note.dueDate).toLocaleDateString()}</span>
                      </div>
                  )}
                  {note.checklist.length > 0 && (
                      <div className="flex items-center gap-1.5">
                          <CheckSquare className="h-3 w-3" />
                          <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                      </div>
                  )}
              </div>
          </div>
      </div>
      <div className="flex items-center gap-2">
          <Badge variant={note.status === 'done' ? 'default' : 'outline'}>{KANBAN_COLUMN_TITLES[note.status]}</Badge>
      </div>
  </div>
);

export function PlanCard({ plan, onArchive, onDelete, onRestore, onViewNote }: PlanCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Card className="shadow-soft w-full overflow-hidden">
        <CardHeader className="p-4 sm:p-6 border-b">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <CardTitle className="font-headline text-xl">{plan.goal}</CardTitle>
              <CardDescription className="mt-2">
                  {plan.notes.length} tasks &bull; Created on {new Date(plan.notes[0].createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {plan.status === 'active' ? (
                      <DropdownMenuItem onClick={onArchive}>
                          <Archive className="mr-2 h-4 w-4" /> Archive Plan
                      </DropdownMenuItem>
                  ) : (
                      <DropdownMenuItem onClick={onRestore}>
                          <ArchiveRestore className="mr-2 h-4 w-4" /> Restore Plan
                      </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Progress value={plan.progress} className="h-2" />
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{Math.round(plan.progress)}%</span>
          </div>
        </CardHeader>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
              <div className="bg-secondary/30">
                <div className="p-2 space-y-1">
                  {plan.notes.map(note => <NoteItem key={note.id} note={note} onClick={() => onViewNote(note)} />)}
                </div>
              </div>
          </CollapsibleContent>
          <CardContent className="p-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full">
                <ChevronDown className={cn("h-4 w-4 mr-2 transition-transform", isOpen && "rotate-180")} />
                <span>{isOpen ? 'Hide Tasks' : `Show ${plan.notes.length} Tasks`}</span>
              </Button>
            </CollapsibleTrigger>
          </CardContent>
      </Collapsible>
    </Card>
  );
}
