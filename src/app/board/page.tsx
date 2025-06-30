
"use client";

import * as React from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { doc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNotes } from "@/contexts/notes-context";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { KanbanColumn } from "@/components/app/kanban-column";
import { type Note, type NoteStatus, type NoteVersion } from "@/lib/types";
import { KANBAN_COLUMNS, KANBAN_COLUMN_TITLES } from "@/lib/constants";
import { NoteViewer } from "@/components/app/note-viewer";
import { NoteEditor } from "@/components/app/note-editor";
import { useToast } from "@/hooks/use-toast";
import { KanbanBoardSkeleton } from "@/components/app/kanban-board-skeleton";
import { LayoutGrid } from "lucide-react";
import { useGamification } from "@/contexts/gamification-context";

type NoteContainers = Record<NoteStatus, Note[]>;

export default function BoardPage() {
  const { notes, isLoading, allTags } = useNotes();
  const [containers, setContainers] = React.useState<NoteContainers>({
    todo: [],
    inprogress: [],
    done: [],
  });

  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const { recordTaskCompletion } = useGamification();
  const [searchTerm, setSearchTerm] = React.useState("");

  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    const filteredNotes = notes.filter(note => 
        !note.isArchived && 
        !note.isTrashed &&
        (searchTerm.trim() === "" ||
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const newContainers: NoteContainers = {
      todo: [],
      inprogress: [],
      done: [],
    };
    for (const note of filteredNotes) {
      if (note.status && KANBAN_COLUMNS.includes(note.status)) {
        newContainers[note.status].push(note);
      } else {
        newContainers.todo.push(note); // Default to 'todo'
      }
    }
    // Sort each column by the 'order' property
    Object.values(newContainers).forEach(column => column.sort((a, b) => a.order - b.order));
    
    setContainers(newContainers);
  }, [notes, searchTerm]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string | number) => {
    for (const key in containers) {
      if (containers[key as NoteStatus].some(note => note.id === id)) {
        return key as NoteStatus;
      }
    }
    return null;
  };
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const { id } = active;
    if (!over) return;
    const { id: overId } = over;
  
    const activeContainer = findContainer(id as string);
    const overContainer = findContainer(overId as string) || (over.id as NoteStatus);
  
    if (
      !activeContainer ||
      !overContainer ||
      activeContainer === overContainer
    ) {
      return;
    }
  
    setContainers((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
  
      const activeIndex = activeItems.findIndex((item) => item.id === id);

      if (activeIndex === -1) {
        return prev;
      }

      const overIndex = overItems.findIndex((item) => item.id === overId);
  
      let newIndex;
      if (overId in prev) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem = over && active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
  
        const modifier = isBelowOverItem ? 1 : 0;
  
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }
      
      const [movedItem] = activeItems.splice(activeIndex, 1);
      if (!movedItem) return prev;
      movedItem.status = overContainer; // Update status locally
      overItems.splice(newIndex, 0, movedItem);
  
      return {
        ...prev,
        [activeContainer]: [...activeItems],
        [overContainer]: [...overItems],
      };
    });
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const { id } = active;
    if (!over) return;
    const { id: overId } = over;

    const activeContainer = findContainer(id as string);
    const overContainer = findContainer(overId as string) || (over.id as NoteStatus);

    if (!activeContainer || !overContainer) return;

    let finalContainers = containers;
    if (activeContainer === overContainer) {
      const activeIndex = containers[activeContainer].findIndex((i) => i.id === id);
      const overIndex = containers[overContainer].findIndex((i) => i.id === overId);
      
      if (activeIndex !== overIndex) {
        const newItems = Array.from(containers[activeContainer]);
        const [movedItem] = newItems.splice(activeIndex, 1);
        if (movedItem) {
            newItems.splice(overIndex > activeIndex ? overIndex -1 : overIndex, 0, movedItem);
        }
        finalContainers = { ...containers, [activeContainer]: newItems };
        setContainers(finalContainers);
      }
    } else {
      // State is updated optimistically in handleDragOver.
      finalContainers = { ...containers };
    }

    const batch = writeBatch(db);

    // Update orders in both source and destination columns
    if (activeContainer !== overContainer) {
      finalContainers[activeContainer].forEach((note, index) => {
        const noteRef = doc(db, "notes", note.id);
        batch.update(noteRef, { order: index });
      });
    }

    finalContainers[overContainer].forEach((note, index) => {
      const noteRef = doc(db, "notes", note.id);
      batch.update(noteRef, { status: overContainer, order: index });
    });

    try {
      await batch.commit();
    } catch (error) {
      console.error("Error updating board:", error);
      toast({
        title: "Update Failed",
        description: "Could not save board changes. Please try again.",
        variant: "destructive",
      });
      // Here you might want to revert the state to the original notes state
    }
  };

  const handleCardClick = (note: Note) => {
    setViewingNote(note);
    setIsViewerOpen(true);
  };
  
  const handleStartEditing = (note: Note) => {
    setIsViewerOpen(false);
    setEditingNote(note);
    setIsEditorOpen(true);
  };
  
  const updateNoteField = async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    if (viewingNote && viewingNote.id === noteId) {
        setViewingNote(prev => prev ? { ...prev, ...updates } : null);
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
      updateNoteField(noteId, { checklist: updatedChecklist });
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
          <main className="flex-1 flex flex-col overflow-hidden bg-background p-4 sm:p-6 transition-all duration-300 ease-in-out">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold font-headline mb-6">Kanban Board</h1>
            </div>
            
            {isLoading ? (
                <KanbanBoardSkeleton />
            ) : (notes.length > 0 || searchTerm) ? (
                <div className="flex-1 min-h-0">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCorners}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                    >
                        <div className="h-full flex gap-4 sm:gap-6 overflow-x-auto pb-2">
                        {KANBAN_COLUMNS.map(columnId => (
                            <KanbanColumn
                            key={columnId}
                            id={columnId}
                            title={KANBAN_COLUMN_TITLES[columnId]}
                            notes={containers[columnId]}
                            onCardClick={handleCardClick}
                            />
                        ))}
                        </div>
                    </DndContext>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-lg bg-background border-2 border-dashed">
                    <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                        <LayoutGrid className="h-12 w-12" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2 font-headline">Your Board is Empty</h2>
                    <p className="text-muted-foreground max-w-sm">
                    Create a note to see it here. Tasks will appear in the 'To Do' column by default.
                    </p>
                </div>
            )}
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
        isSaving={isSaving}
      />
    </>
  );
}
