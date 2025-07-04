
"use client";

import * as React from "react";
import {
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { type Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Square, ListTodo, ChevronRight } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { TodoSkeleton } from "@/components/app/todo-skeleton";
import { useNotes } from "@/contexts/notes-context";
import { ChecklistCompleteMessage } from "@/components/app/checklist-complete";
import { useGamification } from "@/contexts/gamification-context";
import { Separator } from "@/components/ui/separator";
import { useClickSound } from "@/hooks/use-click-sound";

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type GroupedChecklist = {
  noteId: string;
  noteTitle: string;
  noteColor: string;
  items: ChecklistItem[];
};

export default function TodosPage() {
  const { notes, isLoading, allTags } = useNotes();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const { recordTaskCompletion } = useGamification();
  const playClickSound = useClickSound();
  
  const handleChecklistItemToggle = async (noteId: string, checklistItemId: string) => {
    playClickSound();
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      recordTaskCompletion(note, checklistItemId);

      const updatedChecklist = note.checklist.map((item) =>
        item.id === checklistItemId
          ? { ...item, completed: !item.completed }
          : item
      );
      
      const allItemsComplete = updatedChecklist.length > 0 && updatedChecklist.every(item => item.completed);
      const updates: Partial<Omit<Note, 'id'>> = { checklist: updatedChecklist };

      if (allItemsComplete && note.status !== 'done') {
        updates.status = 'done';
        toast({
            title: `List Complete!`,
            description: `All items in "${note.title}" are done. The note status has been updated.`,
        });
      }

      try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, updates);
      } catch (error) {
        console.error("Error updating checklist:", error);
        toast({
          title: "Error Updating Item",
          description: "Could not sync changes. Please try again.",
          variant: "destructive",
        });
        // Real-time listener will revert on failure
      }
    }
  };

  const { inProgressChecklists, completedChecklists } = React.useMemo(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    const allChecklists = notes
      .filter(note => !note.isTrashed && note.checklist && note.checklist.length > 0)
      .map(note => {
        const filteredItems = note.checklist.filter(item => 
          lowercasedSearchTerm === "" || 
          item.text.toLowerCase().includes(lowercasedSearchTerm)
        );

        return {
          noteId: note.id,
          noteTitle: note.title || 'Untitled Note',
          noteColor: note.color,
          items: filteredItems.sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
          }),
        };
      })
      .filter(group => group.items.length > 0);

    const inProgress: GroupedChecklist[] = [];
    const completed: GroupedChecklist[] = [];

    allChecklists.forEach(group => {
      const originalNote = notes.find(n => n.id === group.noteId);
      if (originalNote && originalNote.checklist.some(item => !item.completed)) {
        inProgress.push(group);
      } else {
        completed.push(group);
      }
    });

    return { inProgressChecklists: inProgress, completedChecklists: completed };
  }, [notes, searchTerm]);

  const renderChecklistGroup = (group: GroupedChecklist) => {
    const allComplete = group.items.length > 0 && group.items.every(item => item.completed);
    return (
      <AccordionItem value={group.noteId} key={group.noteId} className="border-none">
        <Card>
          <CardHeader className="p-4">
            <AccordionTrigger className="p-0 hover:no-underline">
              <CardTitle className="text-lg">{group.noteTitle}</CardTitle>
            </AccordionTrigger>
          </CardHeader>
          <AccordionContent>
            <CardContent className="p-4 pt-0">
              <div className="space-y-2">
                {group.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleChecklistItemToggle(group.noteId, item.id)}
                    className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-secondary"
                  >
                    {item.completed ? <CheckSquare className="h-4 w-4 flex-shrink-0 text-primary" /> : <Square className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
                    <span className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>{item.text}</span>
                  </button>
                ))}
              </div>
              {allComplete && <ChecklistCompleteMessage />}
            </CardContent>
          </AccordionContent>
        </Card>
      </AccordionItem>
    );
  };

  const hasTodos = inProgressChecklists.length > 0 || completedChecklists.length > 0;

  return (
    <div className="flex h-screen w-full flex-col bg-secondary">
      <AppHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onToggleSidebar={toggleSidebar}
        tags={allTags}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          isCollapsed={isSidebarCollapsed}
          tags={allTags}
          setSearchTerm={setSearchTerm}
        />
        <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold font-headline mb-6">To-do List</h1>
            {isLoading ? (
                <TodoSkeleton />
            ) : hasTodos ? (
                <div className="space-y-8">
                  {inProgressChecklists.length > 0 && (
                     <Accordion type="multiple" defaultValue={inProgressChecklists.map(g => g.noteId)} className="w-full space-y-4">
                        {inProgressChecklists.map(renderChecklistGroup)}
                     </Accordion>
                  )}
                 
                  {completedChecklists.length > 0 && (
                    <div>
                      {inProgressChecklists.length > 0 && <Separator className="my-8" />}
                      <Collapsible>
                        <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-lg font-semibold text-muted-foreground transition-colors hover:bg-secondary">
                            <ChevronRight className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-90" />
                            <span>Completed ({completedChecklists.length})</span>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-4">
                            <Accordion type="multiple" className="w-full space-y-4 opacity-70">
                                {completedChecklists.map(renderChecklistGroup)}
                            </Accordion>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-lg bg-background border-2 border-dashed">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    <ListTodo className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 font-headline">No To-do Items</h2>
                <p className="text-muted-foreground max-w-sm">
                  {searchTerm.trim() ? `No to-do items match "${searchTerm}".` : 'Checklist items from your notes will appear here.'}
                </p>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
