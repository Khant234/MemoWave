
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
import { Mic, Square, Trash2, Save } from "lucide-react";

type AudioRecorderProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSave: (blob: Blob) => void;
};

export function AudioRecorder({
  open,
  setOpen,
  onSave,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    // Clean up URL object when component unmounts or audioUrl changes
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  React.useEffect(() => {
    if (open) {
      // Reset state when dialog opens
      resetRecording();
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      
      const audioChunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast({
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSave = () => {
    if (audioBlob) {
      onSave(audioBlob);
      setOpen(false);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setAudioBlob(null);
    if(audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Audio</DialogTitle>
          <DialogDescription>
            Record an audio clip to attach to your note.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          {!audioBlob ? (
            <Button
              size="lg"
              className="h-20 w-20 rounded-full"
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <>
                  <Square className="h-8 w-8 animate-pulse" />
                  <span className="sr-only">Stop Recording</span>
                </>
              ) : (
                <>
                  <Mic className="h-8 w-8" />
                  <span className="sr-only">Start Recording</span>
                </>
              )}
            </Button>
          ) : (
            <div className="w-full space-y-4">
              <audio controls src={audioUrl || ''} className="w-full"></audio>
              <div className="flex justify-center gap-4">
                  <Button variant="outline" onClick={resetRecording}>
                      <Trash2 className="mr-2 h-4 w-4"/>
                      Record Again
                  </Button>
                  <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4"/>
                      Save Recording
                  </Button>
              </div>
            </div>
          )}
           <p className="text-sm text-muted-foreground">
            {isRecording ? "Recording in progress..." : (audioBlob ? "Recording complete. Ready to save." : "Click the mic to start recording.")}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
