

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
import { type Note } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";
import { hashText } from "@/lib/crypto";

type UnlockNoteDialogProps = {
  note: Note | null;
  onUnlock: (note: Note) => void;
  onCancel: () => void;
};

export function UnlockNoteDialog({ note, onUnlock, onCancel }: UnlockNoteDialogProps) {
  const [password, setPassword] = React.useState("");
  const { toast } = useToast();

  React.useEffect(() => {
    if (note) {
      setPassword("");
    }
  }, [note]);

  if (!note) return null;

  const handleUnlock = async () => {
    const enteredPasswordHash = await hashText(password);
    if (enteredPasswordHash === note.password) {
      toast({
        title: "Note Unlocked",
        description: `"${note.title || 'Untitled Note'}" is now accessible.`,
      });
      onUnlock(note);
    } else {
      toast({
        title: "Incorrect Password",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
        e.preventDefault();
        handleUnlock();
    }
  };

  return (
    <Dialog open={!!note} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline">
            <KeyRound className="h-5 w-5 text-primary" />
            Password Required
          </DialogTitle>
          <DialogDescription>
            This note is password protected. Please enter the password to view it.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleUnlock}>Unlock Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
