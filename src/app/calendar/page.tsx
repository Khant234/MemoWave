
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ListChecks, ChevronDown, ChevronRight, Clock, Calendar as CalendarIcon } from "lucide-react";
import { CalendarPageSkeleton } from "@/components/app/calendar-page-skeleton";
import { NOTE_PRIORITIES, KANBAN_COLUMN_TITLES, NOTE_PRIORITY_TITLES } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Lazy load modals
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const NoteEditor = React.lazy(() => import('@/components/app/note-editor').then(module => ({ default: module.NoteEditor })));

const AllDayTaskItem = ({ note, onClick }: { note: Note, onClick: (note: Note) => void }) => {
    const isCompleted = note.status === 'done';
    
    return (
        <div 
            onClick={() => onClick(note)} 
            className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary cursor-pointer bg-card/50 border border-transparent transition-colors"
        >
            <div className="flex items-center gap-3">
                 <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: note.color }}></div>
                 <h3 className={cn("font-semibold", isCompleted && "line-through")}>{note.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {note.priority !== 'none' && <Badge variant={note.priority === 'high' && !isCompleted ? 'destructive' : 'outline'}>{NOTE_PRIORITY_TITLES[note.priority]}</Badge>}
                <Badge variant={isCompleted ? "secondary" : "outline"}>{KANBAN_COLUMN_TITLES[note.status]}</Badge>
                {note.checklist.length > 0 && (
                    <div className="flex items-center gap-1">
                        <ListChecks className="h-3 w-3" />
                        <span>{note.checklist.filter(i => i.completed).length}/{note.checklist.length}</span>
                    </div>
                )}
            </div>
        </div>
    );
};


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

    const { overdueTasks, allDayTasks, timedTasks, completedTasks } = React.useMemo(() => {
        if (!selectedDate) return { overdueTasks: [], allDayTasks: [], timedTasks: [], completedTasks: [] };
        
        const selectedDay = startOfDay(selectedDate);
        
        const overdue = notesWithDueDate
            .filter(note => {
                const dueDate = startOfDay(new Date(note.dueDate!));
                return isBefore(dueDate, selectedDay) && note.status !== 'done';
            })
            .sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

        const tasksForDay = notesWithDueDate
            .filter(note => isSameDay(new Date(note.dueDate!), selectedDay));

        const pending = tasksForDay.filter(note => note.status !== 'done');
        const completed = tasksForDay.filter(note => note.status === 'done');
        
        const allDay = pending.filter(note => !note.startTime);
        const timed = pending.filter(note => !!note.startTime)
            .sort((a,b) => a.startTime!.localeCompare(b.startTime!));

        return { overdueTasks: overdue, allDayTasks: allDay, timedTasks: timed, completedTasks: completed };
    }, [notesWithDueDate, selectedDate]);
    
    const handleCardClick = React.useCallback((note: Note) => {
        setViewingNote(note);
        setIsViewerOpen(true);
    }, []);
    
    const handleStartEditing = React.useCallback((note: Note) => {
        setIsViewerOpen(false);
        setEditingNote(note);
        setIsEditorOpen(true);
    }, []);

    const updateNoteField = React.useCallback(async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
        setViewingNote(prev => (prev && prev.id === noteId) ? { ...prev, ...updates } : prev);

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
    }, [toast]);

    const handleChecklistItemToggle = React.useCallback((noteId: string, checklistItemId: string) => {
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
    }, [notes, recordTaskCompletion, toast, updateNoteField]);

    const handleSaveNote = React.useCallback(async (noteToSave: Note) => {
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
    }, [notes, toast]);

    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };
    
    const HOUR_HEIGHT = 56; // in pixels (h-14)
    const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;
    const TIMELINE_START_MINUTE = 6 * 60;

    const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

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
                                    <Card className="shadow-soft w-full lg:w-auto self-start border-none">
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
                                        <Card className="shadow-soft border-none">
                                            <CardHeader>
                                                <CardTitle className="font-headline">
                                                    Schedule for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : ''}
                                                </CardTitle>
                                            </CardHeader>
                                            <ScrollArea className="h-[calc(80vh-180px)] lg:h-[600px]">
                                                <CardContent className="p-4">
                                                    {overdueTasks.length === 0 && allDayTasks.length === 0 && timedTasks.length === 0 && completedTasks.length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground h-full">
                                                            <CalendarIcon className="h-10 w-10 mb-4" />
                                                            <p className="font-medium">No scheduled events for this day.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-6">
                                                             {overdueTasks.length > 0 && (
                                                                <Collapsible defaultOpen>
                                                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 text-left font-headline text-base font-semibold text-destructive hover:bg-destructive/10">
                                                                        <span>Pending from Previous Days ({overdueTasks.length})</span>
                                                                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent className="pt-3 space-y-3">
                                                                        {overdueTasks.map(note => (
                                                                            <AllDayTaskItem key={note.id} note={note} onClick={handleCardClick} />
                                                                        ))}
                                                                    </CollapsibleContent>
                                                                </Collapsible>
                                                            )}

                                                            {(allDayTasks.length > 0 || timedTasks.length > 0) && (
                                                                <div className="space-y-4">
                                                                    {allDayTasks.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <h4 className="px-1 font-semibold">All-day</h4>
                                                                            {allDayTasks.map(note => <AllDayTaskItem key={note.id} note={note} onClick={handleCardClick} />)}
                                                                        </div>
                                                                    )}

                                                                    {timedTasks.length > 0 && (
                                                                        <div className="relative grid grid-cols-[auto,1fr] gap-x-3">
                                                                            {/* Timeline Grid */}
                                                                            <div className="col-start-2">
                                                                                {hours.map(hour => (
                                                                                    <div key={hour} className="h-14 border-t border-dashed"></div>
                                                                                ))}
                                                                            </div>
                                                                            
                                                                            {/* Hour Labels */}
                                                                            <div className="col-start-1 row-start-1">
                                                                                {hours.map(hour => (
                                                                                    <div key={`label-${hour}`} className="h-14 text-right pr-2">
                                                                                        <span className="text-xs text-muted-foreground relative -top-2">
                                                                                            {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>

                                                                            {/* Timed Events */}
                                                                            <div className="col-start-2 row-start-1 relative">
                                                                                {timedTasks.map(note => {
                                                                                    const top = (timeToMinutes(note.startTime!) - TIMELINE_START_MINUTE) * PIXELS_PER_MINUTE;
                                                                                    const end = note.endTime ? timeToMinutes(note.endTime) : timeToMinutes(note.startTime!) + 60;
                                                                                    const height = (end - timeToMinutes(note.startTime!)) * PIXELS_PER_MINUTE;

                                                                                    return (
                                                                                        <div
                                                                                            key={note.id}
                                                                                            style={{ top, height: `${height}px` }}
                                                                                            className="absolute left-0 right-0 z-10 p-2 rounded-lg cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/50"
                                                                                            onClick={() => handleCardClick(note)}
                                                                                        >
                                                                                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: note.color }}></div>
                                                                                            <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: note.color }}></div>
                                                                                            <div className="relative pl-2">
                                                                                                <p className="font-semibold text-xs truncate" style={{ color: note.color }}>{note.title}</p>
                                                                                                <p className="text-xs text-muted-foreground">{note.startTime} {note.endTime ? `- ${note.endTime}`: ''}</p>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            
                                                            {completedTasks.length > 0 && (
                                                                <Collapsible>
                                                                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-md font-semibold text-muted-foreground transition-colors hover:bg-secondary data-[state=open]:bg-secondary">
                                                                        <ChevronRight className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-90" />
                                                                        <span>Completed ({completedTasks.length})</span>
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent className="pt-3 space-y-3">
                                                                        {completedTasks.map(note => (
                                                                            <AllDayTaskItem key={note.id} note={note} onClick={handleCardClick} />
                                                                        ))}
                                                                    </CollapsibleContent>
                                                                </Collapsible>
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
