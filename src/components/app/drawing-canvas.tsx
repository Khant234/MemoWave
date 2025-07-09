"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Palette, Minus, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DRAWING_COLORS = [
  "#000000", // black
  "#ef4444", // red-500
  "#3b82f6", // blue-500
  "#22c55e", // green-500
  "#f97316", // orange-500
  "#a855f7", // purple-500
];

type DrawingCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>;
};

export function DrawingCanvas({ canvasRef }: DrawingCanvasProps) {
  const contextRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = React.useState(false);
  const [color, setColor] = React.useState(DRAWING_COLORS[0]);
  const [lineWidth, setLineWidth] = React.useState(3);

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
    contextRef.current = context;
  }, [canvasRef]);

  React.useEffect(() => {
    if (contextRef.current) {
        contextRef.current.strokeStyle = color;
        contextRef.current.lineWidth = lineWidth;
    }
  }, [color, lineWidth]);

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
        <div className="flex items-center gap-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Palette />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                    <div className="flex gap-1">
                        {DRAWING_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                className={cn(
                                    "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                                    color === c ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent"
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
            <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={() => setLineWidth(w => Math.max(1, w - 1))}><Minus /></Button>
                <span className="w-8 text-center text-sm font-medium">{lineWidth}px</span>
                <Button variant="outline" size="icon" onClick={() => setLineWidth(w => Math.min(20, w + 1))}><Plus /></Button>
            </div>
        </div>
        <Button variant="outline" onClick={clearCanvas}>
          <Eraser className="mr-2 h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  );
}
