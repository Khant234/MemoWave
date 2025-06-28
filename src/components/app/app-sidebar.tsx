
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  isCollapsed?: boolean;
};

export function AppSidebar({
  activeFilter,
  setActiveFilter,
  setSearchTerm,
  tags,
  onTagClick,
  activeTag,
  isMobile,
  isCollapsed,
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
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {navItems.map(({ filter, label, icon: Icon }) => {
          const isActive = activeFilter === filter && (filter === 'all' ? activeTag === '' : true);
          return (
            <TooltipProvider key={filter} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-10 px-3 group relative",
                      !isMobile && isCollapsed ? "justify-center" : "justify-start"
                    )}
                    aria-label={label}
                    onClick={() => handleFilterClick(filter as any)}
                  >
                    <div className={cn("absolute left-0 h-6 w-1 rounded-r-full bg-primary transition-transform scale-y-0 group-hover:scale-y-100", isActive && "scale-y-100")}/>
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={cn(
                      "whitespace-nowrap transition-opacity",
                      !isMobile && isCollapsed && "hidden"
                    )}>{label}</span>
                  </Button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right">
                    {label}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </nav>

      {tags.length > 0 && (
        <>
          <Separator className="mx-4 my-1" />
           <Collapsible defaultOpen className="p-2">
            <CollapsibleTrigger asChild>
                <button className={cn("flex w-full items-center justify-between p-2 hover:bg-secondary rounded-md", isCollapsed && "hidden")}>
                    <h3 className="text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap">Tags</h3>
                    <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1 pt-2">
              {tags.map(tag => {
                const isActive = activeTag === tag;
                return (
                 <TooltipProvider key={tag} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full h-10 px-3 group relative",
                              !isMobile && isCollapsed ? "justify-center" : "justify-start"
                            )}
                            aria-label={tag}
                            onClick={() => onTagClick(tag)}
                          >
                           <div className={cn("absolute left-0 h-6 w-1 rounded-r-full bg-primary transition-transform scale-y-0 group-hover:scale-y-100", isActive && "scale-y-100")}/>
                           <Tag className="h-5 w-5 shrink-0" />
                           <span className={cn(
                             "truncate whitespace-nowrap transition-opacity",
                              !isMobile && isCollapsed && "hidden"
                           )}>{tag}</span>
                          </Button>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          {tag}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })}
            </CollapsibleContent>
           </Collapsible>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return <NavContent />;
  }
  
  return (
    <aside
      data-collapsed={isCollapsed}
      className={cn(
        "hidden sm:flex h-full flex-col bg-card z-40",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-60"
      )}
    >
      <NavContent />
    </aside>
  );
}
