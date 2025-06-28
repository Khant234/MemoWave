
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AppSidebarProps = {
  activeFilter: "all" | "archived" | "trash";
  setActiveFilter: React.Dispatch<React.SetStateAction<"all" | "archived" | "trash">>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  onTagClick: (tag: string) => void;
  activeTag: string;
  isMobile?: boolean;
};

export function AppSidebar({
  activeFilter,
  setActiveFilter,
  setSearchTerm,
  tags,
  onTagClick,
  activeTag,
  isMobile,
}: AppSidebarProps) {
  const handleFilterClick = (filter: "all" | "archived" | "trash") => {
    setActiveFilter(filter);
    setSearchTerm("");
  };

  const navItems = [
    { filter: "all", label: "All Notes", icon: NotepadText },
    { filter: "archived", label: "Archived", icon: Archive },
    { filter: "trash", label: "Trash", icon: Trash2 },
  ];

  const NavContent = () => (
    <TooltipProvider delayDuration={100}>
      <div className="flex flex-col h-full">
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ filter, label, icon: Icon }) => {
            const isActive = activeFilter === filter && (filter === 'all' ? activeTag === '' : true);
            return (
              <Tooltip key={filter}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-10 px-3"
                    aria-label={label}
                    onClick={() => handleFilterClick(filter as any)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={cn(
                      "ml-4 whitespace-nowrap transition-opacity",
                      !isMobile && "opacity-0 group-hover:opacity-100"
                    )}>{label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  <p>{label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {tags.length > 0 && (
          <>
            <Separator className="mx-4 my-1" />
            <div className="flex flex-col gap-1 p-2">
              <h3 className={cn(
                "px-2 pb-1 text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap transition-opacity",
                !isMobile && "opacity-0 group-hover:opacity-100"
              )}>Tags</h3>
              {tags.map(tag => {
                const isActive = activeTag === tag;
                return (
                  <Tooltip key={tag}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start h-10 px-3"
                        aria-label={tag}
                        onClick={() => onTagClick(tag)}
                      >
                        <Tag className="h-5 w-5 shrink-0" />
                        <span className={cn(
                          "ml-4 truncate whitespace-nowrap transition-opacity",
                          !isMobile && "opacity-0 group-hover:opacity-100"
                        )}>{tag}</span>
                      </Button>
                    </TooltipTrigger>
                     <TooltipContent side="right" align="center">
                      <p>{tag}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );

  if (isMobile) {
    return <NavContent />;
  }
  
  return (
    <aside
      className={cn(
        "group hidden sm:flex fixed top-16 left-0 h-[calc(100vh-4rem)] z-40 flex-col bg-card shadow-lg",
        "transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden",
        "w-20 hover:w-60"
      )}
    >
      <NavContent />
    </aside>
  );
}
