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
import { Camera, CameraOff, Loader2, RefreshCw, ScanLine, Check } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

type DocumentScannerProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onTextExtracted: (text: string) => void;
};

export function DocumentScanner({ open, setOpen, onTextExtracted }: DocumentScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    // Stop camera stream when the dialog is closed.
    if (!open) {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      // Reset state for next open
      setCapturedImage(null);
      setHasCameraPermission(null);
    } else {
        // Request camera permission when dialog opens
        const getCameraPermission = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                setHasCameraPermission(true);

                if (videoRef.current) {
                videoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Camera Access Denied',
                    description: 'Please enable camera permissions in your browser settings.',
                });
            }
        };
        getCameraPermission();
    }
  }, [open, toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            // Stop the camera stream after capture
            if (videoRef.current && videoRef.current.srcObject) {
                (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
            }
        }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    // Restart the camera stream
    const getCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
        }
    };
    getCameraPermission();
  };

  const handleUsePhoto = async () => {
    if (!capturedImage) return;

    setIsProcessing(true);
    try {
        const result = await extractTextFromImage({ imageDataUri: capturedImage });
        if (result.extractedText && result.extractedText.trim()) {
            onTextExtracted(result.extractedText);
            toast({
                title: "Text Extracted",
                description: "The scanned text has been added to your note.",
            });
            setOpen(false);
        } else {
            toast({
                title: "No Text Found",
                description: "The AI could not recognize any text in the image.",
                variant: "destructive",
            });
        }
    } catch (error) {
      console.error("OCR Error:", error);
      toast({
        title: "Extraction Failed",
        description: "Could not extract text from the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const renderContent = () => {
    if (hasCameraPermission === null) {
        return <div className="h-80 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }
    if (hasCameraPermission === false) {
        return (
            <div className="h-80 flex items-center justify-center">
                <Alert variant="destructive">
                    <CameraOff className="h-4 w-4"/>
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access in your browser settings to use this feature.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    if (capturedImage) {
        return (
            <div className="space-y-4">
                <img src={capturedImage} alt="Captured document" className="rounded-lg w-full" />
                <div className="flex justify-center gap-4">
                    <Button variant="outline" onClick={handleRetake} disabled={isProcessing}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retake
                    </Button>
                    <Button onClick={handleUsePhoto} disabled={isProcessing}>
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4" />}
                        {isProcessing ? "Processing..." : "Use Photo"}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-secondary" autoPlay playsInline muted />
            <Button onClick={handleCapture} className="w-full">
                <Camera className="mr-2 h-4 w-4" /> Capture
            </Button>
        </div>
    );

  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <ScanLine className="h-6 w-6 text-primary" />
            Scan Document
          </DialogTitle>
          <DialogDescription>
            Position your document in the camera view and capture a photo.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            {renderContent()}
            <canvas ref={canvasRef} className="hidden" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
