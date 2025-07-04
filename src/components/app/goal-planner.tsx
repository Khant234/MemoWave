
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { generateGoalPlan, type GenerateGoalPlanOutput } from "@/ai/flows/generate-goal-plan";
import { Loader2, BrainCircuit } from "lucide-react";

type GoalPlannerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSavePlan: (plan: GenerateGoalPlanOutput['notes'], goal: string) => Promise<void>;
};

export function GoalPlanner({ open, setOpen, onSavePlan }: GoalPlannerProps) {
  const [goal, setGoal] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGeneratePlan = async () => {
    if (!goal.trim()) {
      toast({
        title: "Goal is empty",
        description: "Please describe the goal you want to achieve.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateGoalPlan({ goal });
      if (!result.notes || result.notes.length === 0) {
        throw new Error("The AI could not generate a plan for this goal.");
      }
      await onSavePlan(result.notes, goal);
      toast({
        title: "Plan Generated!",
        description: "Your new goal plan has been added to your notes.",
      });
      setOpen(false);
      setGoal("");
    } catch (error) {
      console.error("Error generating goal plan:", error);
      toast({
        title: "Error Generating Plan",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6" />
            Plan a New Goal with AI
          </DialogTitle>
          <DialogDescription>
            Describe your goal, and our AI will create a structured plan with notes, checklists, and due dates to help you achieve it.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g., 'I want to lose 10 pounds in 3 months' or 'Learn to play the guitar'"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="min-h-[100px]"
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleGeneratePlan} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
