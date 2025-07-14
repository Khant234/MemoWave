
"use client";

import * as React from "react";
import {
  updateDoc,
  doc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppHeader } from "@/components/app/app-header";
import { type Note, type NoteVersion } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { CheckSquare, Square, ListTodo, ChevronRight, ExternalLink } from "lucide-react";
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
import { Button } from "@/components/ui/button";

// Lazy load modals
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const NoteEditor = React.lazy(() => import('@/components/app/note-editor').then(module => ({ default: module.NoteEditor })));


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
  const { notes, isLoading } = useNotes();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const { recordTaskCompletion } = useGamification();
  const playClickSound = useClickSound();

  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const db = getDb();
  
  const updateNoteField = React.useCallback(async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    setViewingNote(prev => (prev && prev.id === noteId) ? { ...prev, ...updates } : prev);
    if (!db) return;
    try {
      const noteRef = doc(db, "notes", noteId);
      await updateDoc(noteRef, updates);
    } catch (error) {
      console.error("Error updating note:", error);
      toast({
        title: "Error Updating Note",
        description: "Could not sync changes. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast, db]);

  const handleChecklistItemToggle = React.useCallback((noteId: string, checklistItemId: string) => {
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

      updateNoteField(noteId, updates);
    }
  }, [notes, playClickSound, recordTaskCompletion, toast, updateNoteField]);

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
  
  const handleViewNote = React.useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) {
      setViewingNote(note);
      setIsViewerOpen(true);
    }
  }, [notes]);

  const handleStartEditing = React.useCallback((note: Note) => {
    setIsViewerOpen(false);
    setEditingNote(note);
    setIsEditorOpen(true);
  }, []);

  const handleSaveNote = React.useCallback(async (noteToSave: Note) => {
    setIsSaving(true);
    if (!db) return;
    try {
        const originalNote = notes.find((n) => n.id === noteToSave.id);
        let newHistory: Note['history'] = originalNote?.history ? [...originalNote.history] : [];
        if (originalNote && (originalNote.content !== noteToSave.content || originalNote.title !== noteToSave.title)) {
            const version: NoteVersion = {
                title: originalNote.title,
                content: originalNote.content,
                updatedAt: originalNote.updatedAt,
            };
            newHistory.unshift(version);
        }
        if (newHistory.length > 20) {
            newHistory = newHistory.slice(0, 20);
        }

        const noteRef = doc(db, "notes", noteToSave.id);
        const {id, ...noteData} = noteToSave;
        const finalNoteData = { ...noteData, history: newHistory };
        await updateDoc(noteRef, finalNoteData as any);

        setIsEditorOpen(false);
        setEditingNote(null);
        
        toast({
            title: "Note Saved",
            description: `Your note "${noteToSave.title || 'Untitled'}" has been saved.`,
        });
    } catch (error) {
      console.error("Error saving note:", error);
      toast({
        title: "Error Saving Note",
        description: "There was a problem saving your note.",
        variant: "destructive",
      });
    } finally {
        setIsSaving(false);
    }
  }, [notes, toast, db]);

  const renderChecklistGroup = (group: GroupedChecklist) => {
    const allComplete = group.items.length > 0 && group.items.every(item => item.completed);
    return (
      <AccordionItem value={group.noteId} key={group.noteId} className="border-none">
        <Card className="shadow-soft border-none">
          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
            <AccordionTrigger className="p-0 hover:no-underline flex-1">
              <CardTitle className="text-lg text-left font-headline">{group.noteTitle}</CardTitle>
            </AccordionTrigger>
            <Button 
                variant="ghost" 
                size="icon" 
                className="ml-4 h-8 w-8 shrink-0"
                onClick={(e) => {
                    e.stopPropagation();
                    handleViewNote(group.noteId);
                }}
            >
                <ExternalLink className="h-4 w-4" />
                <span className="sr-only">View Note</span>
            </Button>
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
    <>
      <div className="flex h-screen w-full flex-col bg-secondary">
        <AppHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onToggleSidebar={toggleSidebar}
        />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            activeCategory={null}
            setActiveCategory={() => {}}
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
                          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-lg font-semibold text-muted-foreground transition-colors hover:bg-secondary data-[state=open]:bg-secondary">
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
                <div className="flex flex-col items-center justify-center h-full text-center p-6 rounded-lg bg-background/50 border-2 border-dashed">
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
      <React.Suspense fallback={null}>
        {isViewerOpen && (
            <NoteViewer
                isOpen={isViewerOpen}
                setIsOpen={setIsViewerOpen}
                note={viewingNote}
                onEdit={handleStartEditing}
                onChecklistItemToggle={handleChecklistItemToggle}
            />
        )}
        {isEditorOpen && (
            <NoteEditor
                isOpen={isEditorOpen}
                setIsOpen={setIsEditorOpen}
                note={editingNote}
                onSave={handleSaveNote}
                isSaving={isSaving}
            />
        )}
      </React.Suspense>
    </>
  );
}
