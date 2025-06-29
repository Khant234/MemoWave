
"use client";

import * as React from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { type Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckSquare, Square, ListTodo } from "lucide-react";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  
  const notesCollectionRef = collection(db, "notes");

  const fetchNotes = async () => {
    setIsLoading(true);
    try {
      const data = await getDocs(query(notesCollectionRef, orderBy("updatedAt", "desc")));
      const fetchedNotes = data.docs.map((doc) => {
        return { ...doc.data(), id: doc.id } as Note;
      });
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Failed to fetch notes from Firestore", error);
      toast({
        title: "Error fetching data",
        description: "Could not load notes data. Please try again.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChecklistItemToggle = async (noteId: string, checklistItemId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (note) {
      const updatedChecklist = note.checklist.map((item) =>
        item.id === checklistItemId
          ? { ...item, completed: !item.completed }
          : item
      );
      
      // Optimistic UI update
      setNotes((prevNotes) =>
        prevNotes.map((n) => (n.id === noteId ? { ...n, checklist: updatedChecklist } : n))
      );

      try {
        const noteRef = doc(db, "notes", noteId);
        await updateDoc(noteRef, { checklist: updatedChecklist });
      } catch (error) {
        console.error("Error updating checklist:", error);
        toast({
          title: "Error Updating Item",
          description: "Could not sync changes. Please try again.",
          variant: "destructive",
        });
        fetchNotes(); // Revert and refetch
      }
    }
  };

  const groupedChecklists = React.useMemo<GroupedChecklist[]>(() => {
    const allChecklists = notes
      .filter(note => !note.isTrashed && note.checklist && note.checklist.length > 0)
      .map(note => ({
        noteId: note.id,
        noteTitle: note.title || 'Untitled Note',
        noteColor: note.color,
        items: [...note.checklist].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        }),
      }));

    if (searchTerm.trim() === "") {
        return allChecklists;
    }

    const lowercasedSearchTerm = searchTerm.toLowerCase();
    
    return allChecklists
        .map(group => ({
            ...group,
            items: group.items.filter(item => item.text.toLowerCase().includes(lowercasedSearchTerm))
        }))
        .filter(group => group.items.length > 0);

  }, [notes, searchTerm]);
  
  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    notes.forEach((note) => {
      if (!note.isTrashed) {
        note.tags.forEach((tag) => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [notes]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading to-dos...</span>
        </div>
      </div>
    );
  }

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
        <main className="flex-1 overflow-y-auto bg-background p-8 transition-all duration-300 ease-in-out">
          <div className="mx-auto max-w-4xl">
            <h1 className="text-3xl font-bold font-headline mb-6">To-do List</h1>
            {groupedChecklists.length > 0 ? (
                <Accordion type="multiple" defaultValue={groupedChecklists.map(g => g.noteId)} className="w-full space-y-4">
                {groupedChecklists.map(group => (
                  <AccordionItem value={group.noteId} key={group.noteId} className="border-none">
                    <Card style={{ borderLeft: `4px solid ${group.noteColor}` }}>
                      <CardHeader className="p-4">
                        <AccordionTrigger className="p-0 hover:no-underline">
                          <Link href={`/?note=${group.noteId}`} className="hover:underline">
                            <CardTitle className="text-lg">{group.noteTitle}</CardTitle>
                          </Link>
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
                        </CardContent>
                      </AccordionContent>
                    </Card>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 rounded-lg bg-background border-2 border-dashed">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    <ListTodo className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 font-headline">No To-do Items</h2>
                <p className="text-muted-foreground max-w-sm">
                  Checklist items from your notes will appear here.
                </p>
            </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
