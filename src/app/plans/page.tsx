
"use client";

import * as React from "react";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useNotes } from "@/contexts/notes-context";
import { type Note } from "@/lib/types";
import { Target, Archive, Trash2, ArchiveRestore, BrainCircuit } from "lucide-react";
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
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PlanCard } from "./plan-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type GenerateGoalPlanOutput } from "@/ai/flows/generate-goal-plan";
import { NOTE_COLORS } from "@/lib/data";

// Lazy load modals
const NoteViewer = React.lazy(() => import('@/components/app/note-viewer').then(module => ({ default: module.NoteViewer })));
const GoalPlanner = React.lazy(() => import('@/components/app/goal-planner').then(module => ({ default: module.GoalPlanner })));

export type PlanStatus = 'active' | 'archived';

export type Plan = {
  id: string;
  goal: string;
  notes: Note[];
  progress: number;
  status: PlanStatus;
};

export default function PlansPage() {
  const { notes, isLoading } = useNotes();
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const [searchTerm, setSearchTerm] = React.useState("");
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = React.useState<PlanStatus>('active');
  const [isConfirmingAction, setIsConfirmingAction] = React.useState<{
    action: 'archive' | 'delete' | 'restore';
    planId: string;
  } | null>(null);

  const [isViewerOpen, setIsViewerOpen] = React.useState(false);
  const [viewingNote, setViewingNote] = React.useState<Note | null>(null);
  const [isPlannerOpen, setIsPlannerOpen] = React.useState(false);

  const notesCollectionRef = React.useMemo(() => collection(db, "notes"), []);
  
  const allPlans = React.useMemo(() => {
    const groupedByPlanId: Record<string, Note[]> = {};
    
    notes
        .filter(note => note.planId && !note.isTrashed)
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
        
        const isArchived = planNotes.every(note => note.isArchived);

        return {
          id: planId,
          goal: planNotes[0].planGoal || "Untitled Plan",
          notes: planNotes.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
          progress,
          status: isArchived ? 'archived' : 'active',
        };
      });
  }, [notes]);

  const filteredPlans = React.useMemo(() => {
    return allPlans
      .filter(plan => plan.status === activeFilter)
      .filter(plan => 
        searchTerm.trim() === "" || plan.goal.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => new Date(b.notes[0].createdAt).getTime() - new Date(b.notes[0].createdAt).getTime());
  }, [allPlans, activeFilter, searchTerm]);

  const handleSavePlan = React.useCallback(async (planNotes: GenerateGoalPlanOutput['notes'], goal: string) => {
    if (planNotes.length === 0) return;

    const batch = writeBatch(db);
    const planId = new Date().toISOString() + Math.random();
    
    planNotes.forEach((planNote, index) => {
        const newNoteData: Omit<Note, 'id'> = {
            title: planNote.title,
            content: planNote.content,
            color: NOTE_COLORS[index % NOTE_COLORS.length],
            isPinned: false,
            isArchived: false,
            isTrashed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            checklist: planNote.checklist.map(item => ({...item, id: new Date().toISOString() + Math.random(), completed: false })),
            history: [],
            isDraft: false,
            status: 'todo',
            priority: 'medium',
            category: planNote.category,
            dueDate: planNote.dueDate,
            showOnBoard: true,
            order: Date.now() + index,
            planId: planId,
            planGoal: goal,
        };
        const newNoteRef = doc(notesCollectionRef);
        batch.set(newNoteRef, newNoteData);
    });

    try {
      await batch.commit();
      toast({
        title: "Plan Created!",
        description: "Your new plan is now active.",
      });
    } catch(err) {
      console.error("Error saving plan:", err);
      toast({
        title: "Error Saving Plan",
        description: "There was an issue saving your new plan.",
        variant: "destructive",
      });
    }
  }, [notesCollectionRef, toast]);


  const handleBatchAction = async () => {
    if (!isConfirmingAction) return;

    const { action, planId } = isConfirmingAction;
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) return;

    const batch = writeBatch(db);
    let successMessage = "";
    
    if (action === 'archive' || action === 'restore') {
      const updates: Partial<Omit<Note, 'id'>> = {};
      if (action === 'archive') {
          updates.isArchived = true;
          updates.isPinned = false;
          successMessage = "Plan archived successfully.";
      } else {
          updates.isArchived = false;
          successMessage = "Plan restored successfully.";
      }
      plan.notes.forEach(note => {
        const noteRef = doc(db, "notes", note.id);
        batch.update(noteRef, updates);
      });
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

    if (filteredPlans.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 rounded-lg bg-background/50 border-2 border-dashed h-[calc(100vh-200px)]">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                <Target className="h-12 w-12" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 font-headline">
              {activeFilter === 'active' ? 'No Active Plans' : 'No Archived Plans'}
            </h2>
            <p className="text-muted-foreground max-w-sm">
                {searchTerm 
                  ? `No plans match "${searchTerm}".` 
                  : activeFilter === 'active' 
                    ? 'Use the AI Goal Planner to create a new plan.'
                    : 'Archived plans will appear here.'
                }
            </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredPlans.map(plan => (
          <PlanCard 
            key={plan.id}
            plan={plan}
            onArchive={() => setIsConfirmingAction({ action: 'archive', planId: plan.id })}
            onDelete={() => setIsConfirmingAction({ action: 'delete', planId: plan.id })}
            onRestore={() => setIsConfirmingAction({ action: 'restore', planId: plan.id })}
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
        />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar
            isCollapsed={isSidebarCollapsed}
            activeCategory={null}
            setActiveCategory={() => {}}
          />
          <main className="flex-1 flex flex-col overflow-y-auto bg-background p-4 sm:p-8 transition-all duration-300 ease-in-out">
            <div className="mx-auto max-w-5xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold font-headline">My Plans</h1>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => setIsPlannerOpen(true)}>
                            <BrainCircuit className="mr-2 h-4 w-4" />
                            New Plan
                        </Button>
                        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as PlanStatus)} className="w-[200px]">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="active">Active</TabsTrigger>
                                <TabsTrigger value="archived">Archived</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
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
              {{
                'archive': 'This will archive all notes associated with this plan. You can find them in the "Archived" section.',
                'delete': 'This action cannot be undone. This will permanently delete all notes associated with this plan.',
                'restore': 'This will restore all notes in this plan and move it back to your active plans.'
              }[isConfirmingAction?.action || 'delete']}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn(isConfirmingAction?.action === 'delete' && buttonVariants({ variant: 'destructive' }))}
              onClick={handleBatchAction}
            >
              {{
                  'archive': <><Archive className="mr-2 h-4 w-4" /> Archive Plan</>,
                  'delete': <><Trash2 className="mr-2 h-4 w-4" /> Delete Permanently</>,
                  'restore': <><ArchiveRestore className="mr-2 h-4 w-4" /> Restore Plan</>
              }[isConfirmingAction?.action || 'delete']}
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
        {isPlannerOpen && (
            <GoalPlanner
                open={isPlannerOpen}
                setOpen={setIsPlannerOpen}
                onSavePlan={handleSavePlan}
            />
        )}
      </React.Suspense>
    </>
  );
}
