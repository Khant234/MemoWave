
"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, PenSquare, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  activeFilter: "all" | "archived" | "trash";
  setActiveFilter: React.Dispatch<React.SetStateAction<"all" | "archived" | "trash">>;
  tags: string[];
  onTagClick: (tag: string) => void;
  activeTag: string;
  isMobile?: boolean;
  onFilterChange?: () => void;
};

export function AppSidebar({ activeFilter, setActiveFilter, tags, onTagClick, activeTag, isMobile, onFilterChange }: AppSidebarProps) {
  const handleFilterClick = (filter: "all" | "archived" | "trash") => {
    setActiveFilter(filter);
    if (isMobile && onFilterChange) {
      onFilterChange();
    }
  };

  const handleTagClick = (tag: string) => {
    onTagClick(tag);
    if (isMobile && onFilterChange) {
      onFilterChange();
    }
  }

  if (isMobile) {
    return (
      <nav className="grid gap-4 text-lg font-medium p-6">
        <div
          className="flex items-center gap-2 text-lg font-semibold"
        >
          <PenSquare className="h-6 w-6" />
          <span className="">MemoWeave</span>
        </div>
        <button
          onClick={() => handleFilterClick("all")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            activeFilter === "all" && activeTag === '' && "bg-muted text-primary"
          )}
        >
          <NotepadText className="h-4 w-4" />
          All Notes
        </button>
        <button
          onClick={() => handleFilterClick("archived")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            activeFilter === "archived" && "bg-muted text-primary"
          )}
        >
          <Archive className="h-4 w-4" />
          Archived
        </button>
        <button
          onClick={() => handleFilterClick("trash")}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            activeFilter === "trash" && "bg-muted text-primary"
          )}
        >
          <Trash2 className="h-4 w-4" />
          Trash
        </button>

        {tags.length > 0 && (
          <div className="space-y-2 pt-4">
              <div className="border-t -mx-6"></div>
              <h3 className="px-3 pt-4 text-sm font-semibold text-muted-foreground tracking-wider uppercase">Tags</h3>
              <div className="flex flex-col gap-1">
                  {tags.map((tag) => (
                      <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary text-base",
                              activeTag === tag && "bg-muted text-primary"
                          )}
                      >
                          <Tag className="h-4 w-4" />
                          {tag}
                      </button>
                  ))}
              </div>
          </div>
        )}
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
                  activeFilter === "all" && activeTag === '' && "bg-primary/10 text-primary"
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activeFilter === "trash" ? "secondary" : "ghost"}
                size="icon"
                className={cn(
                  "rounded-lg",
                  activeFilter === "trash" && "bg-primary/10 text-primary"
                )}
                aria-label="Trash"
                onClick={() => setActiveFilter("trash")}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Trash</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </nav>
      {tags.length > 0 && (
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 py-4 border-t">
          {tags.map(tag => (
            <TooltipProvider key={tag}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={activeTag === tag ? "secondary" : "ghost"}
                    size="icon"
                    className={cn(
                      "rounded-lg",
                      activeTag === tag && "bg-primary/10 text-primary"
                    )}
                    aria-label={tag}
                    onClick={() => onTagClick(tag)}
                  >
                    <Tag className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{tag}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>
      )}
    </aside>
  );
}
