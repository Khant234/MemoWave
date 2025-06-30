
"use client";

import * as React from "react";
import { add, format, isSameDay } from 'date-fns';
import { useNotes } from "@/contexts/notes-context";
import { type Note } from "@/lib/types";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import Link from 'next/link';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, List, ListChecks } from "lucide-react";
import { NoteViewer } from "@/components/app/note-viewer";
import { NoteEditor } from "@/components/app/note-editor";

export default function CalendarPage() {
    const { notes, isLoading, allTags } = useNotes();
    const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
    const [searchTerm, setSearchTerm] = React.useState("");
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
    
    const [isViewerOpen, setIsViewerOpen] = React.useState(false);
    const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [editingNote, setEditingNote] = React.useState<Note | null>(null);

    const notesWithDueDate = React.useMemo(() => {
        return notes.filter(note => note.dueDate && !note.isTrashed && !note.isArchived);
    }, [notes]);
    
    const daysWithNotes = React.useMemo(() => {
        return notesWithDueDate.map(note => new Date(note.dueDate!));
    }, [notesWithDueDate]);

    const notesForSelectedDay = React.useMemo(() => {
        if (!selectedDate) return [];
        return notesWithDueDate
            .filter(note => isSameDay(new Date(note.dueDate!), selectedDate))
            .sort((a,b) => (a.priority > b.priority ? -1 : 1)); // Simplified sort
    }, [notesWithDueDate, selectedDate]);
    
    const handleViewNote = (note: Note) => {
        setViewingNote(note);
        setIsViewerOpen(true);
    };
    
    const handleStartEditing = (note: Note) => {
        setIsViewerOpen(false);
        setEditingNote(note);
        setIsEditorOpen(true);
    };

    // Dummy handlers for viewer/editor
    const handleChecklistItemToggle = () => {};
    const handleSaveNote = () => {};

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
                    <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 transition-all duration-300 ease-in-out">
                        <div className="mx-auto max-w-7xl">
                            <h1 className="text-3xl font-bold font-headline mb-6">Calendar</h1>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <Card className="lg:col-span-2">
                                    <CardContent className="p-2 sm:p-4">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={setSelectedDate}
                                            modifiers={{ due: daysWithNotes }}
                                            modifiersClassNames={{ due: 'bg-primary/20 rounded-full' }}
                                            className="w-full"
                                        />
                                    </CardContent>
                                </Card>
                                <div className="lg:col-span-1">
                                    <h2 className="text-xl font-semibold mb-4">
                                        Tasks for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : '...'}
                                    </h2>
                                    <Card>
                                        <ScrollArea className="h-[60vh]">
                                            <CardContent className="p-4">
                                                {notesForSelectedDay.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {notesForSelectedDay.map(note => (
                                                            <div key={note.id} onClick={() => handleViewNote(note)} className="block p-3 rounded-lg hover:bg-secondary cursor-pointer border-l-4" style={{borderColor: note.color}}>
                                                                <h3 className="font-semibold">{note.title}</h3>
                                                                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                                                                    <Badge variant={note.priority === 'high' ? 'destructive' : 'outline'}>{note.priority}</Badge>
                                                                    <span>{note.status}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                                         <ListChecks className="h-10 w-10 mb-4" />
                                                        <p>No tasks due on this day.</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </ScrollArea>
                                    </Card>
                                </div>
                            </div>
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
            <NoteEditor
                isOpen={isEditorOpen}
                setIsOpen={setIsEditorOpen}
                note={editingNote}
                onSave={handleSaveNote}
            />
        </>
    );
}
