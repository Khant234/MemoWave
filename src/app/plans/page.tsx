
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useNotes } from "@/contexts/notes-context";
import { type Note } from "@/lib/types";
import { Target, Archive, Trash2 } from "lucide-react";
import { PlansPageSkeleton } from "./plans-page-skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { writeBatch, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlanCard } from "./plan-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Lazy load modals
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const NoteEditor = React.lazy(() => import('@/components/app/note-editor').then(module => ({ default: module.NoteEditor })));

export type Plan = {
  id: string;
  goal: string;
  notes: Note[];
  progress: number;
};

export default function PlansPage() {
  const { notes, isLoading, allTags } = useNotes();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const [isConfirmingAction, setIsConfirmingAction] = React.useState<{
    action: 'archive' | 'delete';
    planId: string;
  } | null>(null);

  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
  
  const plans = React.useMemo(() => {
    const groupedByPlanId: Record<string, Note[]> = {};
    
    notes
        .filter(note => note.planId)
        .forEach(note => {
            if (!groupedByPlanId[note.planId!]) {
                groupedByPlanId[note.planId!] = [];
            }
            groupedByPlanId[note.planId!].push(note);
        });

    return Object.entries(groupedByPlanId)
      .map(([planId, planNotes]): Plan => {
        const allChecklistItems = planNotes.flatMap(note => note.checklist);
        const completedItems = allChecklistItems.filter(item => item.completed).length;
        const progress = allChecklistItems.length > 0 ? (completedItems / allChecklistItems.length) * 100 : 0;
        
        return {
          id: planId,
          goal: planNotes[0].planGoal || "Untitled Plan",
          notes: planNotes.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
          progress,
        };
      })
      .filter(plan => 
        !plan.notes.every(note => note.isTrashed || note.isArchived) &&
        (searchTerm.trim() === "" || plan.goal.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => new Date(b.notes[0].createdAt).getTime() - new Date(a.notes[0].createdAt).getTime());
  }, [notes, searchTerm]);

  const handleBatchAction = async () => {
    if (!isConfirmingAction) return;

    const { action, planId } = isConfirmingAction;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const batch = writeBatch(db);
    let successMessage = "";

    if (action === 'archive') {
      plan.notes.forEach(note => {
        const noteRef = doc(db, "notes", note.id);
        batch.update(noteRef, { isArchived: true, isPinned: false });
      });
      successMessage = "Plan archived successfully.";
    } else if (action === 'delete') {
      plan.notes.forEach(note => {
        const noteRef = doc(db, "notes", note.id);
        batch.delete(noteRef);
      });
      successMessage = "Plan deleted permanently.";
    }

    try {
      await batch.commit();
      toast({
        title: "Success",
        description: successMessage,
      });
    } catch (error) {
      console.error(`Error ${action}ing plan:`, error);
      toast({
        title: "Error",
        description: `Could not ${action} the plan. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsConfirmingAction(null);
    }
  };
  
  const handleViewNote = React.useCallback((note: Note) => {
    setViewingNote(note);
    setIsViewerOpen(true);
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return <PlansPageSkeleton />;
    }

    if (plans.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-lg bg-background/50 border-2 border-dashed h-[calc(100vh-200px)]">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Target className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 font-headline">No Plans Yet</h2>
            <p className="text-muted-foreground max-w-sm">
                {searchTerm ? `No plans match "${searchTerm}".` : 'Use the AI Goal Planner to create a new plan.'}
            </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        {plans.map(plan => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            onArchive={() => setIsConfirmingAction({ action: 'archive', planId: plan.id })}
            onDelete={() => setIsConfirmingAction({ action: 'delete', planId: plan.id })}
            onViewNote={handleViewNote}
          />
        ))}
      </div>
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
          <main className="flex-1 flex flex-col overflow-y-auto bg-background p-4 sm:p-8 transition-all duration-300 ease-in-out">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-3xl font-bold font-headline mb-6">My Plans</h1>
                <div className="flex-1">
                  {renderContent()}
                </div>
            </div>
          </main>
        </div>
      </div>
      <AlertDialog open={!!isConfirmingAction} onOpenChange={() => setIsConfirmingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {isConfirmingAction?.action === 'archive' 
                ? 'This will archive all notes associated with this plan. You can find them in the "Archived" section.'
                : 'This action cannot be undone. This will permanently delete all notes associated with this plan.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(isConfirmingAction?.action === 'delete' && buttonVariants({ variant: 'destructive' }))}
              onClick={handleBatchAction}
            >
              {isConfirmingAction?.action === 'archive' ? <> <Archive className="mr-2 h-4 w-4" /> Archive Plan </> : <> <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently </>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <React.Suspense fallback={null}>
        {isViewerOpen && (
            <NoteViewer
                isOpen={isViewerOpen}
                setIsOpen={setIsViewerOpen}
                note={viewingNote}
                onEdit={() => {}}
                onChecklistItemToggle={() => {}}
            />
        )}
      </React.Suspense>
    </>
  );
}
