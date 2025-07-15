
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
import { useToast } from "@/hooks/use-toast";
import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
import { Loader2, PenLine } from "lucide-react";
import { HandwritingCanvas } from "./handwriting-canvas";

type HandwritingInputProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onRecognitionComplete: (text: string) => void;
};

export default function HandwritingInput({
  open,
  setOpen,
  onRecognitionComplete,
}: HandwritingInputProps) {
  const [isRecognizing, setIsRecognizing] = React.useState(false);
  const { toast } = useToast();

  const handleRecognize = async (dataUrl: string) => {
    setIsRecognizing(true);
    try {
      const result = await extractTextFromImage({ imageDataUri: dataUrl });
      if (result.extractedText && result.extractedText.trim()) {
        onRecognitionComplete(result.extractedText);
        toast({
          title: "Text Recognized",
          description: "The handwritten text has been added to your note.",
        });
        setOpen(false);
      } else {
        toast({
          title: "No Text Found",
          description:
            "The AI could not recognize any text. Please try writing more clearly.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Handwriting recognition error:", error);
      toast({
        title: "Recognition Failed",
        description: "Could not recognize the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRecognizing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <PenLine className="h-6 w-6 text-primary" />
            Handwriting Input
          </DialogTitle>
          <DialogDescription>
            Write on the canvas below. The AI will convert your handwriting to
            text.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isRecognizing ? (
            <div className="flex flex-col items-center justify-center h-80 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">
                Recognizing your handwriting...
              </p>
            </div>
          ) : (
            <HandwritingCanvas onRecognize={handleRecognize} />
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isRecognizing}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
