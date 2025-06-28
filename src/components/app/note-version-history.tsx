
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { type NoteVersion } from "@/lib/types";
import { Separator } from "@/components/ui/separator";
import { Clock, Repeat } from "lucide-react";

type NoteVersionHistoryProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  history: NoteVersion[];
  onRestore: (version: NoteVersion) => void;
};

export function NoteVersionHistory({
  open,
  setOpen,
  history,
  onRestore,
}: NoteVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = React.useState<NoteVersion | null>(null);

  React.useEffect(() => {
    if (open) {
      // When opening, reset the selected version or select the first one
      setSelectedVersion(history?.[0] || null);
    }
  }, [open, history]);
  
  const handleRestore = () => {
    if(selectedVersion) {
        onRestore(selectedVersion);
        setOpen(false);
    }
  }

  const formattedDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Note Version History</DialogTitle>
          <DialogDescription>
            Browse and restore previous versions of your note.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow grid grid-cols-3 gap-6 overflow-hidden">
          <div className="col-span-1 flex flex-col border-r pr-6">
            <h3 className="text-lg font-semibold mb-4">Versions</h3>
            <ScrollArea className="flex-grow">
              <div className="space-y-2">
                {history.length > 0 ? history.map((version, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVersion(version)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${selectedVersion?.updatedAt === version.updatedAt ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
                  >
                    <p className="font-medium text-sm truncate">{version.title || "Untitled"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Clock className="h-3 w-3" />
                        {formattedDate(version.updatedAt)}
                    </p>
                  </button>
                )) : (
                    <div className="text-center text-muted-foreground py-10">
                        <p>No history available.</p>
                    </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <div className="col-span-2 flex flex-col overflow-hidden">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Version Preview</h3>
                {selectedVersion && (
                     <Button onClick={handleRestore} size="sm">
                        <Repeat className="mr-2 h-4 w-4" />
                        Restore This Version
                    </Button>
                )}
             </div>
            <ScrollArea className="flex-grow rounded-md border p-4 bg-secondary/50">
              {selectedVersion ? (
                <div>
                  <h4 className="font-bold text-xl mb-2">{selectedVersion.title}</h4>
                  <Separator className="my-4"/>
                  <p className="whitespace-pre-wrap text-sm">{selectedVersion.content}</p>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Select a version to preview its content.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
