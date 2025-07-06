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
import { Loader2, BrainCircuit, Calendar, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

type GoalPlannerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSavePlan: (plan: GenerateGoalPlanOutput['notes'], goal: string) => Promise<void>;
};

const PlanPreview = ({ plan }: { plan: GenerateGoalPlanOutput['notes'] }) => (
    <div className="space-y-4">
        <ScrollArea className="h-[50vh] pr-4 -mr-4">
            <Accordion type="multiple" defaultValue={plan.map((_, i) => `item-${i}`)} className="w-full space-y-3">
                {plan.map((note, index) => (
                    <AccordionItem value={`item-${index}`} key={index} className="border-none">
                        <div className="border rounded-lg shadow-soft overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline bg-secondary/50">
                            <div className="flex-1 text-left space-y-1">
                                    <p className="font-semibold">{note.title}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Due: {new Date(note.dueDate).toLocaleDateString()}</span>
                                    </div>
                            </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="space-y-3 pt-4">
                                    <p className="text-sm text-muted-foreground">{note.content}</p>
                                    {note.checklist.length > 0 && (
                                        <div className="space-y-1.5 pt-2">
                                            {note.checklist.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                    <CheckSquare className="h-4 w-4 text-primary/70" />
                                                    <span>{item.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {note.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-2">
                                            {note.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                                        </div>
                                    )}
                                </div>
                            </AccordionContent>
                        </div>
                    </AccordionItem>
                ))}
            </Accordion>
        </ScrollArea>
    </div>
);
  
const LoadingSkeleton = () => (
    <div className="space-y-3 h-[50vh]">
        {Array.from({length: 3}).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
        ))}
    </div>
);


export function GoalPlanner({ open, setOpen, onSavePlan }: GoalPlannerProps) {
  const [goal, setGoal] = React.useState("");
  const [language, setLanguage] = React.useState("English");
  const [isLoading, setIsLoading] = React.useState(false);
  const [generatedPlan, setGeneratedPlan] = React.useState<GenerateGoalPlanOutput['notes'] | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setGoal("");
        setLanguage("English");
        setIsLoading(false);
        setGeneratedPlan(null);
      }, 300);
    }
  }, [open]);

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
    setGeneratedPlan(null);
    try {
      const result = await generateGoalPlan({ goal, targetLanguage: language });
      if (!result.notes || result.notes.length === 0) {
        throw new Error("The AI could not generate a plan for this goal.");
      }
      setGeneratedPlan(result.notes);
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

  const handleSavePlanClick = async () => {
    if (!generatedPlan || !goal) return;

    setIsLoading(true);
    try {
        await onSavePlan(generatedPlan, goal);
        toast({
            title: "Plan Saved!",
            description: "Your new goal plan has been added to your notes.",
        });
        setOpen(false);
    } catch (error) {
        console.error("Error saving plan:", error);
        toast({
            title: "Error Saving Plan",
            description: "There was an issue saving your new plan.",
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setGeneratedPlan(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <BrainCircuit className="h-6 w-6" />
            {generatedPlan ? "Review Your Plan" : "Plan a New Goal with AI"}
          </DialogTitle>
          <DialogDescription>
            {generatedPlan 
              ? "Here's the plan our AI generated. Review the steps below, and if you're happy with it, save it to create your new notes."
              : "Describe your goal, and our AI will create a structured plan with notes, checklists, and due dates to help you achieve it."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : generatedPlan ? (
            <PlanPreview plan={generatedPlan} />
          ) : (
            <div className="space-y-4">
                <Textarea
                  placeholder="e.g., 'Run a marathon in 6 months' or 'Launch a new podcast'"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-[120px] text-base"
                  disabled={isLoading}
                />
                 <div>
                    <Label htmlFor="language-select">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger id="language-select" className="mt-2">
                            <SelectValue placeholder="Select language..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Burmese">Burmese</SelectItem>
                            <SelectItem value="Spanish">Spanish</SelectItem>
                            <SelectItem value="French">French</SelectItem>
                            <SelectItem value="Japanese">Japanese</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          {generatedPlan ? (
            <>
              <Button variant="ghost" onClick={handleGoBack} disabled={isLoading}>
                Back
              </Button>
              <Button onClick={handleSavePlanClick} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Plan"
                )}
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
