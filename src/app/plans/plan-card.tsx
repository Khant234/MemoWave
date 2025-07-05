
"use client";

import * as React from "react";
import { type Note } from "@/lib/types";
import { type Plan } from "./page";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Archive, MoreVertical, Trash2, ChevronRight, CheckSquare, Clock, ArchiveRestore } from "lucide-react";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { KANBAN_COLUMN_TITLES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

type PlanCardProps = {
  plan: Plan;
  onArchive: () => void;
  onDelete: () => void;
  onRestore: () => void;
  onViewNote: (note: Note) => void;
};

export function PlanCard({ plan, onArchive, onDelete, onRestore, onViewNote }: PlanCardProps) {

  const NoteItem = ({ note }: { note: Note }) => (
    <div 
        className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/50 transition-colors cursor-pointer group"
        onClick={() => onViewNote(note)}
    >
        <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: note.color }}></div>
            <div>
                <p className="font-medium">{note.title}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                    {note.dueDate && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(note.dueDate).toLocaleDateString()}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <CheckSquare className="h-3 w-3" />
                        <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                    </div>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant={note.status === 'done' ? 'default' : 'outline'}>{KANBAN_COLUMN_TITLES[note.status]}</Badge>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </div>
    </div>
  );

  return (
    <AccordionItem value={plan.id} className="border-none">
      <Card className="shadow-soft w-full overflow-hidden transition-all duration-300 data-[state=open]:shadow-lg">
        <AccordionTrigger className="p-4 sm:p-6 w-full text-left hover:no-underline [&>svg]:ml-4 data-[state=open]:bg-secondary/30">
            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <CardTitle className="font-headline text-xl">{plan.goal}</CardTitle>
                        <CardDescription className="mt-2">
                            {plan.notes.length} tasks &bull; Created on {new Date(plan.notes[0].createdAt).toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <div className="flex items-center ml-4" onClick={e => e.stopPropagation()}>
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
            </div>
        </AccordionTrigger>
        <AccordionContent>
            <div className="divide-y divide-border border-t px-2 pb-2">
                {plan.notes.map(note => <NoteItem key={note.id} note={note} />)}
            </div>
        </AccordionContent>
      </Card>
    </AccordionItem>
  );
}
