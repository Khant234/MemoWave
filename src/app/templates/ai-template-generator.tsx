"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type NoteTemplate } from "@/lib/types";
import { generateTemplate } from "@/ai/flows/generate-template";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type AiTemplateGeneratorProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onEdit: (template: NoteTemplate) => void;
};

const LoadingSkeleton = () => (
    <div className="space-y-4 p-4 border rounded-lg bg-secondary/50">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="pt-4 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/2" />
        </div>
    </div>
);


export function AiTemplateGenerator({ open, setOpen, onEdit }: AiTemplateGeneratorProps) {
  const [prompt, setPrompt] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setPrompt("");
        setIsLoading(false);
      }, 300);
    }
  }, [open]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt is empty",
        description: "Please describe the template you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateTemplate({ prompt });
      
      const generatedTemplate: NoteTemplate = {
        ...result,
        id: '', 
        isCustom: true,
      };
      
      onEdit(generatedTemplate);
      setOpen(false);
      toast({
        title: "Template Generated!",
        description: "Review the AI-generated template and save it.",
      });

    } catch (error) {
      console.error("Error generating template:", error);
      toast({
        title: "Error Generating Template",
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
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Sparkles className="h-6 w-6 text-primary" />
            Generate Template with AI
          </DialogTitle>
          <DialogDescription>
            Describe the kind of template you need, and our AI will build it for you. Be as descriptive as you like!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <Textarea
              placeholder="e.g., 'A simple daily journal template with a checklist for morning habits' or 'A template for planning a new software feature'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[120px] text-base"
              disabled={isLoading}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
