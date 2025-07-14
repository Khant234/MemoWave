
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Note } from "@/lib/types";
import { QRCode } from "react-qrcode-logo";
import { Copy, Check } from "lucide-react";

type ShareNoteDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  note: Note | null;
};

export function ShareNoteDialog({ open, setOpen, note }: ShareNoteDialogProps) {
  const [shareUrl, setShareUrl] = React.useState("");
  const [hasCopied, setHasCopied] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (note && open) {
      // Construct the URL to share the note
      const url = new URL(window.location.origin);
      url.searchParams.set('note', note.id);
      setShareUrl(url.toString());
      setHasCopied(false);
    }
  }, [note, open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setHasCopied(true);
      toast({
        title: "Copied to Clipboard",
        description: "The share link has been copied.",
      });
      setTimeout(() => setHasCopied(false), 2000); // Reset after 2 seconds
    }, (err) => {
      toast({
        title: "Failed to Copy",
        description: "Could not copy the link to your clipboard.",
        variant: "destructive",
      });
    });
  };
  
  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
          <DialogDescription>
            Anyone with this link or QR code will be able to view this note.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-6 py-4">
            <div className="p-4 bg-white rounded-lg border">
                <QRCode value={shareUrl} size={180} />
            </div>
          <div className="w-full space-y-2">
            <Label htmlFor="share-link">Shareable Link</Label>
            <div className="flex gap-2">
                <Input id="share-link" value={shareUrl} readOnly />
                <Button size="icon" onClick={handleCopy}>
                    {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">Copy link</span>
                </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

