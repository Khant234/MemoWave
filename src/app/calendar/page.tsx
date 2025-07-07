
"use client";

import * as React from "react";
import { format, isSameDay, isBefore, startOfDay, isToday } from 'date-fns';
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
import { KANBAN_COLUMN_TITLES, NOTE_PRIORITY_TITLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Lazy load modals
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const NoteEditor = React.lazy(() => import('@/components/app/note-editor').then(module => ({ default: module.NoteEditor })));

const AllDayTaskItem = ({ note, onClick, isOverdue }: { note: Note, onClick: (note: Note) => void, isOverdue?: boolean }) => {
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
                {isOverdue && !isCompleted && <Badge variant="destructive">Overdue</Badge>}
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
    const { notes, isLoading } = useNotes();
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
                note.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [notes, searchTerm]);
    
    const daysWithNotes = React.useMemo(() => {
        return notesWithDueDate.map(note => new Date(note.dueDate!));
    }, [notesWithDueDate]);

    const timeToMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const { overdueTasks, allDayTasks, timedTasks, completedTasks } = React.useMemo(() => {
        if (!selectedDate) return { overdueTasks: [], allDayTasks: [], timedTasks: [], completedTasks: [] };
        
        const today = startOfDay(new Date());
        const selectedDay = startOfDay(selectedDate);
        
        const overdue = notesWithDueDate
            .filter(note => {
                const dueDate = startOfDay(new Date(note.dueDate!));
                return isBefore(dueDate, today) && note.status !== 'done';
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
    
    const { timelineStartHour, timelineHours } = React.useMemo(() => {
        if (timedTasks.length === 0) {
            return { timelineStartHour: 8, timelineHours: Array.from({ length: 11 }, (_, i) => i + 8) }; // Default 8am to 6pm
        }
        
        const allTimes = timedTasks.flatMap(note => [
            timeToMinutes(note.startTime!),
            note.endTime ? timeToMinutes(note.endTime) : timeToMinutes(note.startTime!) + 60
        ]);
        const minTime = Math.min(...allTimes);
        const maxTime = Math.max(...allTimes);

        const startHour = Math.max(0, Math.floor(minTime / 60) - 1);
        const endHour = Math.min(24, Math.ceil(maxTime / 60) + 1);
        
        const duration = endHour - startHour;
        if (duration < 8) {
            const newEndHour = Math.min(24, startHour + 8);
            return { timelineStartHour: startHour, timelineHours: Array.from({ length: newEndHour - startHour }, (_, i) => i + startHour) };
        }

        const hours = Array.from({ length: endHour - startHour }, (_, i) => i + startHour);
        return { timelineStartHour: startHour, timelineHours: hours };
    }, [timedTasks]);
    
    const HOUR_HEIGHT = 64; // h-16
    const PIXELS_PER_MINUTE = HOUR_HEIGHT / 60;
    
    const laidOutTimedTasks = React.useMemo(() => {
        const events = timedTasks.map(note => ({
            ...note,
            start: timeToMinutes(note.startTime!),
            end: note.endTime ? timeToMinutes(note.endTime) : timeToMinutes(note.startTime!) + 60,
        }));
    
        const groups: (typeof events[0])[][] = [];
        events.sort((a, b) => a.start - b.start).forEach(event => {
            let placed = false;
            for (const group of groups) {
                if (group.some(e => e.start < event.end && e.end > event.start)) {
                    group.push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                groups.push([event]);
            }
        });
    
        const finalLayout: (typeof events[0] & { layout: { top: number; height: number; left: string; width: string; } })[] = [];

        for (const group of groups) {
            const columns: (typeof events[0])[][] = [];
            group.sort((a,b) => a.start - b.start);

            for (const event of group) {
                let placed = false;
                for (const col of columns) {
                    if (col[col.length - 1].end <= event.start) {
                        col.push(event);
                        placed = true;
                        break;
                    }
                }
                if (!placed) {
                    columns.push([event]);
                }
            }
            
            const numColumns = columns.length;
            columns.forEach((col, colIndex) => {
                col.forEach(event => {
                    const width = 100 / numColumns;
                    finalLayout.push({
                        ...event,
                        layout: {
                            top: (event.start - timelineStartHour * 60) * PIXELS_PER_MINUTE,
                            height: (event.end - event.start) * PIXELS_PER_MINUTE,
                            width: `calc(${width}% - 4px)`,
                            left: `calc(${width * colIndex}%)`
                        }
                    });
                });
            });
        }
        
        return finalLayout;
    
    }, [timedTasks, timelineStartHour]);


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
                    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 transition-all duration-300 ease-in-out">
                        <div className="mx-auto max-w-7xl">
                            <h1 className="text-3xl font-bold font-headline mb-6">Calendar</h1>
                            {isLoading ? (
                                <CalendarPageSkeleton />
                            ) : (
                                <div className="flex flex-col lg:flex-row gap-6 items-start">
                                    <Card className="shadow-soft w-full lg:w-auto self-start">
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
                                        <Card className="shadow-soft">
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
                                                             {selectedDate && isToday(selectedDate) && overdueTasks.length > 0 && (
                                                                <Collapsible defaultOpen>
                                                                    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-3 text-left font-headline text-base font-semibold text-destructive hover:bg-destructive/10">
                                                                        <span>Pending from Previous Days ({overdueTasks.length})</span>
                                                                        <ChevronDown className="h-5 w-5 shrink-0 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                                                                    </CollapsibleTrigger>
                                                                    <CollapsibleContent className="pt-3 space-y-3">
                                                                        {overdueTasks.map(note => (
                                                                            <AllDayTaskItem key={note.id} note={note} onClick={handleCardClick} isOverdue />
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
                                                                                {timelineHours.map(hour => (
                                                                                    <div key={hour} className="h-16 border-t border-dashed"></div>
                                                                                ))}
                                                                            </div>
                                                                            
                                                                            {/* Hour Labels */}
                                                                            <div className="col-start-1 row-start-1">
                                                                                {timelineHours.map(hour => (
                                                                                    <div key={`label-${hour}`} className="h-16 text-right pr-2">
                                                                                        <span className="text-xs text-muted-foreground relative -top-2">
                                                                                            {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>

                                                                            {/* Timed Events */}
                                                                            <div className="col-start-2 row-start-1 relative">
                                                                                {laidOutTimedTasks.map(event => {
                                                                                    return (
                                                                                        <div
                                                                                            key={event.id}
                                                                                            style={{ 
                                                                                                top: event.layout.top, 
                                                                                                height: `${event.layout.height}px`,
                                                                                                width: event.layout.width,
                                                                                                left: event.layout.left
                                                                                            }}
                                                                                            className="absolute z-10 p-1 rounded cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary/50"
                                                                                            onClick={() => handleCardClick(event)}
                                                                                        >
                                                                                            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: event.color }}></div>
                                                                                            <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: event.color }}></div>
                                                                                            <div className="relative pl-2">
                                                                                                <p className="font-semibold text-xs truncate" style={{ color: event.color }}>{event.title}</p>
                                                                                                <p className="text-xs text-muted-foreground">{event.startTime} {event.endTime ? `- ${event.endTime}`: ''}</p>
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
 