
"use client";

import * as React from "react";
import { format, isSameDay, isBefore, startOfDay } from 'date-fns';
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
import { cn } from "@/lib/utils";


const CalendarTaskItem = ({ note, isOverdue = false, onClick }: { note: Note, isOverdue?: boolean, onClick: (note: Note) => void }) => {
    const isCompleted = note.status === 'done';
    
    return (
        <div 
            onClick={() => onClick(note)} 
            className={cn(
                "block p-3 rounded-lg hover:bg-secondary cursor-pointer border-l-4 bg-card border transition-colors", 
                isCompleted && "opacity-60",
                isOverdue && !isCompleted && "border-destructive/70 bg-destructive/5 hover:bg-destructive/10"
            )} 
            style={{borderColor: isOverdue && !isCompleted ? 'hsl(var(--destructive))' : note.color}}
        >
            <h3 className={cn("font-semibold", isCompleted && "line-through")}>{note.title}</h3>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-2 flex-wrap">
                    {isOverdue && !isCompleted && (
                        <Badge variant="destructive">Overdue</Badge>
                    )}
                    {note.priority !== 'none' && <Badge variant={note.priority === 'high' && !isCompleted ? 'destructive' : 'outline'}>{NOTE_PRIORITY_TITLES[note.priority]}</Badge>}
                    <Badge variant={isCompleted ? "secondary" : "outline"}>{KANBAN_COLUMN_TITLES[note.status]}</Badge>
                </div>
                {note.checklist.length > 0 && (
                    <div className="flex items-center gap-1">
                        <ListChecks className="h-3 w-3" />
                        <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

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
        return notes.filter(note => 
            note.dueDate && 
            !note.isTrashed && 
            !note.isArchived &&
            (searchTerm.trim() === "" ||
                note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
        );
    }, [notes, searchTerm]);
    
    const daysWithNotes = React.useMemo(() => {
        return notesWithDueDate.map(note => new Date(note.dueDate!));
    }, [notesWithDueDate]);

    const { overdueTasks, pendingTasks, completedTasks } = React.useMemo(() => {
        if (!selectedDate) return { overdueTasks: [], pendingTasks: [], completedTasks: [] };
        
        const today = startOfDay(new Date());
        const selectedDay = startOfDay(selectedDate);
        
        const showOverdue = !isBefore(selectedDay, today);

        const tasksForDay = notesWithDueDate
            .filter(note => isSameDay(new Date(note.dueDate!), selectedDay))
            .sort((a,b) => NOTE_PRIORITIES.indexOf(b.priority) - NOTE_PRIORITIES.indexOf(a.priority));

        let overdue = [];
        if (showOverdue) {
            overdue = notesWithDueDate
                .filter(note => {
                    const dueDate = startOfDay(new Date(note.dueDate!));
                    return isBefore(dueDate, today) && note.status !== 'done';
                })
                .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
        }
        
        const pending = tasksForDay.filter(note => note.status !== 'done');
        const completed = tasksForDay.filter(note => note.status === 'done');

        return { overdueTasks: overdue, pendingTasks: pending, completedTasks: completed };
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
                        <div className="mx-auto max-w-7xl">
                            <h1 className="text-3xl font-bold font-headline mb-6">Calendar</h1>
                            {isLoading ? (
                                <CalendarPageSkeleton />
                            ) : (
                                <div className="flex flex-col lg:flex-row gap-6 items-start">
                                    <Card className="shadow-sm w-full lg:w-auto self-start">
                                        <CardContent className="p-0 flex justify-center">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDate}
                                                onSelect={setSelectedDate}
                                                modifiers={{ due: daysWithNotes }}
                                                modifiersClassNames={{ due: 'has-due-date' }}
                                            />
                                        </CardContent>
                                    </Card>
                                    <div className="flex-1 w-full">
                                        <Card className="shadow-sm">
                                            <ScrollArea className="h-[520px]">
                                                <CardContent className="p-4">
                                                    {overdueTasks.length === 0 && pendingTasks.length === 0 && completedTasks.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground h-full">
                                                            <ListChecks className="h-10 w-10 mb-4" />
                                                            <p className="font-medium">No tasks for this day.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                            {overdueTasks.length > 0 && (
                                                                <div className="space-y-3">
                                                                    <h4 className="text-base font-semibold text-destructive px-1 font-headline">Overdue</h4>
                                                                    {overdueTasks.map(note => (
                                                                        <CalendarTaskItem key={note.id} note={note} isOverdue onClick={handleCardClick} />
                                                                    ))}
                                                                </div>
                                                            )}
                                
                                                            {(pendingTasks.length > 0 || completedTasks.length > 0) && (
                                                                <div className="space-y-3">
                                                                    <h4 className="text-base font-semibold text-foreground px-1 font-headline">
                                                                        Tasks for {selectedDate ? format(selectedDate, 'MMMM d') : ''}
                                                                    </h4>
                                                                    {pendingTasks.map(note => (
                                                                        <CalendarTaskItem key={note.id} note={note} onClick={handleCardClick} />
                                                                    ))}
                                                                    {pendingTasks.length > 0 && completedTasks.length > 0 && <Separator className="my-3" />}
                                                                    {completedTasks.map(note => (
                                                                        <CalendarTaskItem key={note.id} note={note} onClick={handleCardClick} />
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
