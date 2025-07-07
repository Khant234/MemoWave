"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

type HandwritingCanvasProps = {
  onRecognize: (dataUrl: string) => void;
};

export function HandwritingCanvas({ onRecognize }: HandwritingCanvasProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust for screen density for crisper lines
    const scale = window.devicePixelRatio;
    canvas.width = canvas.offsetWidth * scale;
    canvas.height = canvas.offsetHeight * scale;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.lineCap = "round";
    context.strokeStyle = "hsl(var(--foreground))"; // Use theme color
    context.lineWidth = 3;
    contextRef.current = context;
  }, []);

  const getEventCoordinates = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();

    if ("touches" in event.nativeEvent) {
      return {
        x: event.nativeEvent.touches[0].clientX - rect.left,
        y: event.nativeEvent.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (event.nativeEvent as MouseEvent).offsetX,
      y: (event.nativeEvent as MouseEvent).offsetY,
    };
  };

  const startDrawing = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const coords = getEventCoordinates(event);
    if (!coords || !contextRef.current) return;

    contextRef.current.beginPath();
    contextRef.current.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const finishDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const draw = (
    event:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing || !contextRef.current) return;

    if ("touches" in event.nativeEvent) {
        event.preventDefault(); // Prevent scrolling on touch devices
    }

    const coords = getEventCoordinates(event);
    if (!coords) return;

    contextRef.current.lineTo(coords.x, coords.y);
    contextRef.current.stroke();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleRecognizeClick = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      onRecognize(dataUrl);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <canvas
        ref={canvasRef}
        className="w-full h-64 sm:h-80 border-2 border-dashed rounded-lg bg-secondary/50 cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseMove={draw}
        onMouseLeave={finishDrawing}
        onTouchStart={startDrawing}
        onTouchEnd={finishDrawing}
        onTouchMove={draw}
      />
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={clearCanvas}>
          <Eraser className="mr-2 h-4 w-4" />
          Clear
        </Button>
        <Button onClick={handleRecognizeClick}>Recognize Text</Button>
      </div>
    </div>
  );
}
