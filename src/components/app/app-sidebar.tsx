"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  activeFilter: "all" | "archived";
  setActiveFilter: React.Dispatch<React.SetStateAction<"all" | "archived">>;
  isMobile?: boolean;
};

export function AppSidebar({ activeFilter, setActiveFilter, isMobile }: AppSidebarProps) {
  if (isMobile) {
    return (
      <nav className="grid gap-6 text-lg font-medium p-6">
        <div
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <PenSquare className="h-6 w-6" />
          <span className="">MemoWeave</span>
        </div>
        <button
          onClick={() => setActiveFilter("all")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            activeFilter === "all" && "bg-muted text-primary"
          )}
        >
          <NotepadText className="h-4 w-4" />
          All Notes
        </button>
        <button
          onClick={() => setActiveFilter("archived")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            activeFilter === "archived" && "bg-muted text-primary"
          )}
        >
          <Archive className="h-4 w-4" />
          Archived
        </button>
      </nav>
    );
  }
  
  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 py-4">
        <div className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
          <PenSquare className="h-5 w-5 transition-all group-hover:scale-110" />
          <span className="sr-only">MemoWeave</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFilter === "all" ? "secondary" : "ghost"}
                size="icon"
                className={cn(
                  "rounded-lg",
                  activeFilter === "all" && "bg-primary/10 text-primary"
                )}
                aria-label="All Notes"
                onClick={() => setActiveFilter("all")}
              >
                <NotepadText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">All Notes</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFilter === "archived" ? "secondary" : "ghost"}
                size="icon"
                className={cn(
                  "rounded-lg",
                  activeFilter === "archived" && "bg-primary/10 text-primary"
                )}
                aria-label="Archived"
                onClick={() => setActiveFilter("archived")}
              >
                <Archive className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Archived</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
