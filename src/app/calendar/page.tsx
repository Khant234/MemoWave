
"use client";

import * as React from "react";
import { format, isSameDay } from 'date-fns';
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNotes } from "@/contexts/notes-context";
import { type Note, type NoteVersion } from "@/lib/types";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useGamification } from "@/contexts/gamification-context";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListChecks } from "lucide-react";
import { NoteViewer } from "@/components/app/note-viewer";
import { NoteEditor } from "@/components/app/note-editor";
import { CalendarPageSkeleton } from "@/components/app/calendar-page-skeleton";
import { NOTE_PRIORITIES, KANBAN_COLUMN_TITLES, NOTE_PRIORITY_TITLES } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { ChecklistViewer } from "@/components/app/checklist-viewer";

export default function CalendarPage() {
    const { notes, isLoading, allTags } = useNotes();
    const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
    
    const { toast } = useToast();
    const { recordTaskCompletion } = useGamification();
    const [isViewerOpen, setIsViewerOpen] = React.useState(false);
    const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [editingNote, setEditingNote] = React.useState<Note | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isChecklistViewerOpen, setIsChecklistViewerOpen] = React.useState(false);
    const [viewingChecklistNote, setViewingChecklistNote] = React.useState<Note | null>(null);

    const notesWithDueDate = React.useMemo(() => {
        const filteredNotes = notes.filter(note => 
            note.dueDate && 
            !note.isTrashed && 
            !note.isArchived &&
            (searchTerm.trim() === "" ||
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );
        return filteredNotes;
    }, [notes, searchTerm]);
    
    const daysWithNotes = React.useMemo(() => {
        // Highlight days that have any tasks, regardless of completion status.
        return notesWithDueDate.map(note => new Date(note.dueDate!));
    }, [notesWithDueDate]);

    const { pendingTasks, completedTasks } = React.useMemo(() => {
        if (!selectedDate) return { pendingTasks: [], completedTasks: [] };
        
        const tasksForDay = notesWithDueDate
            .filter(note => isSameDay(new Date(note.dueDate!), selectedDate))
            .sort((a,b) => NOTE_PRIORITIES.indexOf(b.priority) - NOTE_PRIORITIES.indexOf(a.priority));
    
        const pending = tasksForDay.filter(note => note.status !== 'done');
        const completed = tasksForDay.filter(note => note.status === 'done');
        
        return { pendingTasks: pending, completedTasks: completed };
    }, [notesWithDueDate, selectedDate]);
    
    const handleCardClick = (note: Note) => {
        setViewingChecklistNote(note);
        setIsChecklistViewerOpen(true);
    };

    const handleViewFullNote = (note: Note) => {
        setViewingNote(note);
        setIsViewerOpen(true);
    }
    
    const handleStartEditing = (note: Note) => {
        setIsViewerOpen(false);
        setIsChecklistViewerOpen(false);
        setEditingNote(note);
        setIsEditorOpen(true);
    };

    const updateNoteField = async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
        if (viewingNote && viewingNote.id === noteId) {
            setViewingNote(prev => prev ? { ...prev, ...updates } : null);
        }
        if (viewingChecklistNote && viewingChecklistNote.id === noteId) {
            setViewingChecklistNote(prev => prev ? { ...prev, ...updates } : null);
        }

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
    };

    const handleChecklistItemToggle = (noteId: string, checklistItemId: string) => {
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
                title: `Task Complete!`,
                description: `"${note.title}" has been marked as done.`,
            });
          }

          updateNoteField(noteId, updates);
        }
    };

    const handleSaveNote = async (noteToSave: Note) => {
        setIsSaving(true);
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
    };

    return (
        <>
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
                    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 transition-all duration-300 ease-in-out">
                        <div className="mx-auto max-w-6xl">
                            <h1 className="text-3xl font-bold font-headline mb-6">Calendar</h1>
                            {isLoading ? (
                                <CalendarPageSkeleton />
                            ) : (
                                <div className="flex flex-col lg:flex-row justify-center gap-8 items-start">
                                    <Card className="shadow-sm">
                                        <CardContent className="p-2 sm:p-4">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                modifiers={{ due: daysWithNotes }}
                                                modifiersClassNames={{ due: 'has-due-date' }}
                                            />
                                        </CardContent>
                                    </Card>
                                    <div className="w-full lg:w-[400px] flex-shrink-0">
                                        <h2 className="text-xl font-semibold mb-4 font-headline">
                                            Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}
                                        </h2>
                                        <Card className="shadow-sm">
                                            <ScrollArea className="h-[470px]">
                                                <CardContent className="p-4">
                                                    {pendingTasks.length === 0 && completedTasks.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground h-full">
                                                            <ListChecks className="h-10 w-10 mb-4" />
                                                            <p className="font-medium">No tasks due on this day.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {pendingTasks.length > 0 && (
                                                                <div className="space-y-3">
                                                                    {pendingTasks.map(note => (
                                                                        <div key={note.id} onClick={() => handleCardClick(note)} className="block p-3 rounded-lg hover:bg-secondary cursor-pointer border-l-4 bg-background transition-colors" style={{borderColor: note.color}}>
                                                                            <h3 className="font-semibold">{note.title}</h3>
                                                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    {note.priority !== 'none' && <Badge variant={note.priority === 'high' ? 'destructive' : 'outline'}>{NOTE_PRIORITY_TITLES[note.priority]}</Badge>}
                                                                                    <Badge variant="outline">{KANBAN_COLUMN_TITLES[note.status]}</Badge>
                                                                                </div>
                                                                                {note.checklist.length > 0 && (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <ListChecks className="h-3 w-3" />
                                                                                        <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {pendingTasks.length > 0 && completedTasks.length > 0 && <Separator className="my-4" />}
                                                            {completedTasks.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <h4 className="text-sm font-medium text-muted-foreground px-1">Completed</h4>
                                                                    {completedTasks.map(note => (
                                                                        <div key={note.id} onClick={() => handleCardClick(note)} className="block p-3 rounded-lg hover:bg-secondary cursor-pointer border-l-4 bg-background opacity-60 transition-colors" style={{borderColor: note.color}}>
                                                                            <h3 className="font-semibold line-through">{note.title}</h3>
                                                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                                                                                <div className="flex items-center gap-2">
                                                                                    {note.priority !== 'none' && <Badge variant='outline'>{NOTE_PRIORITY_TITLES[note.priority]}</Badge>}
                                                                                    <Badge variant="secondary">Done</Badge>
                                                                                </div>
                                                                                {note.checklist.length > 0 && (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <ListChecks className="h-3 w-3" />
                                                                                        <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </ScrollArea>
                                        </Card>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
            <NoteViewer
                isOpen={isViewerOpen}
                setIsOpen={setIsViewerOpen}
                note={viewingNote}
                onEdit={handleStartEditing}
                onChecklistItemToggle={handleChecklistItemToggle}
            />
            <ChecklistViewer
                isOpen={isChecklistViewerOpen}
                setIsOpen={setIsChecklistViewerOpen}
                note={viewingChecklistNote}
                onChecklistItemToggle={handleChecklistItemToggle}
                onEditNote={handleStartEditing}
                onViewFullNote={handleViewFullNote}
            />
            <NoteEditor
                isOpen={isEditorOpen}
                setIsOpen={setIsEditorOpen}
                note={editingNote}
                onSave={handleSaveNote}
                isSaving={isSaving}
            />
        </>
    );
}
