
"use client";

import * as React from "react";
import {
  DndContext,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  KeyboardSensor,
  DragOverlay,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { doc, writeBatch, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNotes } from "@/contexts/notes-context";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { KanbanColumn } from "@/components/app/kanban-column";
import { type Note, type NoteStatus, type NoteVersion, type NotePriority } from "@/lib/types";
import { KANBAN_COLUMNS, KANBAN_COLUMN_TITLES, NOTE_PRIORITIES, NOTE_PRIORITY_TITLES } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";
import { KanbanBoardSkeleton } from "@/components/app/kanban-board-skeleton";
import { LayoutGrid } from "lucide-react";
import { useGamification } from "@/contexts/gamification-context";
import { KanbanCardContent } from "@/components/app/kanban-card-content";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Lazy load modals
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const NoteEditor = React.lazy(() => import('@/components/app/note-editor').then(module => ({ default: module.NoteEditor })));
const ChecklistViewer = React.lazy(() => import('@/components/app/checklist-viewer').then(module => ({ default: module.ChecklistViewer })));


type NoteContainers = Record<string, Note[]>; // e.g. { 'work-todo': [note1], 'personal-inprogress': [note2] }

type GroupedRenderData = {
    groupTitle: string;
    groupKey: string;
    columns: {
        todo: Note[];
        inprogress: Note[];
        done: Note[];
    }
};

export default function BoardPage() {
  const { notes, isLoading, allTags } = useNotes();
  const [containers, setContainers] = React.useState<NoteContainers>({});
  const [groupedRenderData, setGroupedRenderData] = React.useState<GroupedRenderData[]>([]);

  const { toast } = useToast();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const { recordTaskCompletion } = useGamification();
  const [searchTerm, setSearchTerm] = React.useState("");

  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState<Note | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const isBoardUpdating = React.useRef(false);
  const [activeNote, setActiveNote] = React.useState<Note | null>(null);
  const [groupBy, setGroupBy] = React.useState<'none' | 'tag' | 'priority'>('none');
  const [isChecklistViewerOpen, setIsChecklistViewerOpen] = React.useState(false);
  const [viewingChecklistNote, setViewingChecklistNote] = React.useState<Note | null>(null);


  React.useEffect(() => {
    if (isBoardUpdating.current) {
        return;
    }
    const filteredNotes = notes.filter(note => 
        note.showOnBoard &&
        !note.isArchived && 
        !note.isTrashed &&
        (searchTerm.trim() === "" ||
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const newContainers: NoteContainers = {};
    const groupKeys: Record<string, string> = {}; 

    if (groupBy === 'none') {
        groupKeys['all'] = 'All Tasks';
        KANBAN_COLUMNS.forEach(status => {
            newContainers[`all-${status}`] = [];
        });

        for (const note of filteredNotes) {
            const status = note.status || 'todo';
            const containerId = `all-${status}`;
            if (newContainers[containerId]) {
                newContainers[containerId].push(note);
            }
        }
    } else if (groupBy === 'tag') {
        const uniqueTags = ['untagged', ...allTags];
        uniqueTags.forEach(tag => {
            const title = tag === 'untagged' ? 'Untagged' : tag;
            groupKeys[tag] = title;
            KANBAN_COLUMNS.forEach(status => {
                newContainers[`${tag}-${status}`] = [];
            });
        });
        
        for (const note of filteredNotes) {
            const status = note.status || 'todo';
            const tag = note.tags[0] || 'untagged';
            const containerId = `${tag}-${status}`;
            if (newContainers[containerId]) {
                newContainers[containerId].push(note);
            }
        }
    } else if (groupBy === 'priority') {
        NOTE_PRIORITIES.forEach(priority => {
            groupKeys[priority] = NOTE_PRIORITY_TITLES[priority];
            KANBAN_COLUMNS.forEach(status => {
                newContainers[`${priority}-${status}`] = [];
            });
        });

        for (const note of filteredNotes) {
            const priority = note.priority || 'none';
            const status = note.status || 'todo';
            const containerId = `${priority}-${status}`;
            if (newContainers[containerId]) {
                newContainers[containerId].push(note);
            }
        }
    }

    Object.values(newContainers).forEach(column => column.sort((a, b) => a.order - b.order));
    
    setContainers(newContainers);

    const newGroupedRenderData = Object.entries(groupKeys)
        .map(([groupKey, groupTitle]) => ({
            groupTitle,
            groupKey,
            columns: {
                todo: newContainers[`${groupKey}-todo`] || [],
                inprogress: newContainers[`${groupKey}-inprogress`] || [],
                done: newContainers[`${groupKey}-done`] || [],
            }
        }))
        .filter(group => 
            group.columns.todo.length > 0 || 
            group.columns.inprogress.length > 0 || 
            group.columns.done.length > 0
        )
        .sort((a, b) => {
            if (groupBy === 'priority') {
                return NOTE_PRIORITIES.indexOf(a.groupKey as NotePriority) - NOTE_PRIORITIES.indexOf(b.groupKey as NotePriority);
            }
            if (groupBy === 'tag') {
                if (a.groupKey === 'untagged') return 1;
                if (b.groupKey === 'untagged') return -1;
                return a.groupTitle.localeCompare(b.groupTitle);
            }
            return 0;
        });

    setGroupedRenderData(newGroupedRenderData);

  }, [notes, searchTerm, groupBy, allTags]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = React.useCallback((id: string | number) => {
    if (typeof id === 'string' && id in containers) {
      return id;
    }
    for (const key in containers) {
      if (containers[key].some(note => note.id === id)) {
        return key;
      }
    }
    return null;
  }, [containers]);

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const { active } = event;
    const note = notes.find((n) => n.id === active.id);
    if (note) {
      setActiveNote(note);
    }
    isBoardUpdating.current = true;
    document.body.style.cursor = "grabbing";
  }, [notes]);
  
  const handleDragEnd = React.useCallback(async (event: DragEndEvent) => {
    document.body.style.cursor = "";
    const { active, over } = event;
    setActiveNote(null);
  
    if (!over || active.id === over.id) {
      isBoardUpdating.current = false;
      return;
    }
  
    const activeId = active.id as string;
    const overId = over.id as string;
  
    const activeContainerId = findContainer(activeId);
    let overContainerId = findContainer(overId);
  
    if (overId in containers) {
      overContainerId = overId;
    }
  
    if (!activeContainerId || !overContainerId) {
      isBoardUpdating.current = false;
      return;
    }
  
    const newContainers = JSON.parse(JSON.stringify(containers));
  
    if (activeContainerId === overContainerId) {
      const items = newContainers[activeContainerId];
      const oldIndex = items.findIndex((i: Note) => i.id === activeId);
      const newIndex = items.findIndex((i: Note) => i.id === overId);
  
      if (oldIndex !== -1 && newIndex !== -1) {
        newContainers[activeContainerId] = arrayMove(items, oldIndex, newIndex);
      }
    } else {
      const activeItems = newContainers[activeContainerId];
      const overItems = newContainers[overContainerId];
      const activeIndex = activeItems.findIndex((i: Note) => i.id === activeId);
  
      if (activeIndex === -1) return;
  
      const [movedItem] = activeItems.splice(activeIndex, 1);
      const overIndex = overItems.findIndex((i: Note) => i.id === overId);
      const newIndex = overIndex !== -1 ? overIndex : overItems.length;
  
      overItems.splice(newIndex, 0, movedItem);
    }
  
    setContainers(newContainers);
    
    const groupKeys: Record<string, string> = {}; 
    if (groupBy === 'none') {
        groupKeys['all'] = 'All Tasks';
    } else if (groupBy === 'tag') {
        const uniqueTags = ['untagged', ...allTags];
        uniqueTags.forEach(tag => {
            const title = tag === 'untagged' ? 'Untagged' : tag;
            groupKeys[tag] = title;
        });
    } else if (groupBy === 'priority') {
        NOTE_PRIORITIES.forEach(priority => {
            groupKeys[priority] = NOTE_PRIORITY_TITLES[priority];
        });
    }

    const newGroupedRenderData = Object.entries(groupKeys)
        .map(([groupKey, groupTitle]) => ({
            groupTitle,
            groupKey,
            columns: {
                todo: newContainers[`${groupKey}-todo`] || [],
                inprogress: newContainers[`${groupKey}-inprogress`] || [],
                done: newContainers[`${groupKey}-done`] || [],
            }
        }))
        .filter(group => 
            group.columns.todo.length > 0 || 
            group.columns.inprogress.length > 0 || 
            group.columns.done.length > 0
        )
        .sort((a, b) => {
            if (groupBy === 'priority') {
                return NOTE_PRIORITIES.indexOf(a.groupKey as NotePriority) - NOTE_PRIORITIES.indexOf(b.groupKey as NotePriority);
            }
            if (groupBy === 'tag') {
                if (a.groupKey === 'untagged') return 1;
                if (b.groupKey === 'untagged') return -1;
                return a.groupTitle.localeCompare(b.groupTitle);
            }
            return 0;
        });
    setGroupedRenderData(newGroupedRenderData);
  
    const batch = writeBatch(db);
    for (const containerId in newContainers) {
      const [groupKey, status] = containerId.split('-');
      newContainers[containerId].forEach((note: Note, index: number) => {
        const noteRef = doc(db, "notes", note.id);
        const updates: Partial<Omit<Note, 'id'>> = {
          order: index,
          status: status as NoteStatus,
        };
  
        const originalNote = notes.find(n => n.id === note.id);
        if (originalNote) {
            if (groupBy === 'priority' && originalNote.priority !== groupKey) {
                updates.priority = groupKey as NotePriority;
            } else if (groupBy === 'tag') {
                const originalGroupKey = originalNote.tags[0] || 'untagged';
                if (originalGroupKey !== groupKey) {
                    let newTags = originalNote.tags.filter(t => t !== originalGroupKey);
                    if (groupKey !== 'untagged') {
                        newTags.unshift(groupKey);
                    }
                    updates.tags = [...new Set(newTags)];
                }
            }
        }
        batch.update(noteRef, updates);
      });
    }
  
    try {
      await batch.commit();
      toast({
        title: "Board Updated",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error updating board:", error);
      toast({
        title: "Update Failed",
        description: "Could not save board changes. Please try again.",
        variant: "destructive",
      });
    } finally {
        isBoardUpdating.current = false;
    }
  }, [containers, findContainer, groupBy, allTags, notes, toast]);

  const handleCardClick = React.useCallback((note: Note) => {
    setViewingChecklistNote(note);
    setIsChecklistViewerOpen(true);
  }, []);
  
  const handleViewFullNote = React.useCallback((note: Note) => {
    setViewingNote(note);
    setIsViewerOpen(true);
  }, []);

  const handleStartEditing = React.useCallback((note: Note) => {
    setIsViewerOpen(false);
    setIsChecklistViewerOpen(false);
    setEditingNote(note);
    setIsEditorOpen(true);
  }, []);
  
  const updateNoteField = React.useCallback(async (noteId: string, updates: Partial<Omit<Note, 'id'>>) => {
    setViewingNote(prev => (prev && prev.id === noteId) ? { ...prev, ...updates } : prev);
    setViewingChecklistNote(prev => (prev && prev.id === noteId) ? { ...prev, ...updates } : prev);

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
          title: `Moved to "Done"`,
          description: `"${note.title}" was automatically moved to the Done column.`,
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

  const renderContent = () => {
    if (isLoading) {
      return <KanbanBoardSkeleton />;
    }

    const hasNotesOnBoard = groupedRenderData.some(g => g.columns.todo.length > 0 || g.columns.inprogress.length > 0 || g.columns.done.length > 0);

    if (!hasNotesOnBoard) {
        const emptyTitle = searchTerm ? `No results for "${searchTerm}"` : "Your Board is Empty";
        const emptyDescription = searchTerm 
            ? "Try a different search term to find your notes." 
            : "Add notes to the board from the editor, or create a new note with a checklist to track it here.";
        
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-lg bg-background/50 border-2 border-dashed">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                    <LayoutGrid className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-semibold mb-2 font-headline">{emptyTitle}</h2>
                <p className="text-muted-foreground max-w-sm">{emptyDescription}</p>
            </div>
        );
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 flex gap-4 sm:gap-6 overflow-x-auto pb-4">
            {groupedRenderData.map(({ groupKey, groupTitle, columns }) => (
              <div key={groupKey} className="flex flex-col h-full">
                {groupBy !== "none" && (
                  <h2 className="text-xl font-bold mb-4 px-1 capitalize sticky top-0 bg-background z-10 py-2">
                    {groupTitle}
                  </h2>
                )}
                <div className="flex gap-4 sm:gap-6">
                  {KANBAN_COLUMNS.map((columnId) => (
                    <KanbanColumn
                      key={`${groupKey}-${columnId}`}
                      id={`${groupKey}-${columnId}`}
                      title={KANBAN_COLUMN_TITLES[columnId]}
                      notes={columns[columnId]}
                      onCardClick={handleCardClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <DragOverlay>
          {activeNote ? (
            <KanbanCardContent note={activeNote} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    );
  }

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
            <div className="flex items-center justify-between flex-shrink-0 mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold font-headline">Kanban Board</h1>
                <Select value={groupBy} onValueChange={(value) => setGroupBy(value as any)}>
                    <SelectTrigger className="w-[150px] sm:w-[180px]">
                        <SelectValue placeholder="Group by..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Grouping</SelectItem>
                        <SelectItem value="priority">By Priority</SelectItem>
                        <SelectItem value="tag">By Tag</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="flex-1 flex flex-col min-h-0">
               {renderContent()}
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
        {isChecklistViewerOpen && (
            <ChecklistViewer
                isOpen={isChecklistViewerOpen}
                setIsOpen={setIsChecklistViewerOpen}
                note={viewingChecklistNote}
                onChecklistItemToggle={handleChecklistItemToggle}
                onEditNote={handleStartEditing}
                onViewFullNote={handleViewFullNote}
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
