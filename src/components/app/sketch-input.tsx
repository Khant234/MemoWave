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
import { DrawingCanvas } from "./drawing-canvas";
import { Palette, Save } from "lucide-react";

type SketchInputProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSave: (dataUrl: string) => void;
};

export function SketchInput({
  open,
  setOpen,
  onSave,
}: SketchInputProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Create a new canvas to draw a white background
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const ctx = newCanvas.getContext('2d');
      if(ctx) {
        // Fill background with the card color from the theme
        const computedStyle = getComputedStyle(document.documentElement);
        const cardColor = `hsl(${computedStyle.getPropertyValue('--card').trim()})`;
        ctx.fillStyle = cardColor;
        ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        
        // Draw the existing canvas content on top
        ctx.drawImage(canvas, 0, 0);

        // Get the data URL from the new canvas
        const dataUrl = newCanvas.toDataURL("image/png");
        onSave(dataUrl);
        setOpen(false);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <Palette className="h-6 w-6 text-primary" />
            Add a Sketch
          </DialogTitle>
          <DialogDescription>
            Draw a sketch to attach to your note. It will be saved as an image.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <DrawingCanvas canvasRef={canvasRef} />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4"/>
              Save Sketch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
