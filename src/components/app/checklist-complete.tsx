
"use client";

import { PartyPopper } from "lucide-react";

export function ChecklistCompleteMessage() {
  return (
    <div className="mt-4 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 p-4 text-center">
        <div className="flex justify-center items-center mb-2">
            <PartyPopper className="h-8 w-8 text-primary" />
        </div>
      <h4 className="text-lg font-semibold text-primary/90">All Done!</h4>
      <p className="text-sm text-primary/80">
        You've completed all items on this list. Great job!
      </p>
    </div>
  );
}
