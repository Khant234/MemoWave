
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag, ChevronDown } from "lucide-react";
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
      <div className="flex items-center justify-between p-2 pt-4 data-[collapsed=true]:justify-center" data-collapsed={!isMobile && isCollapsed}>
        <div className={cn("flex items-center gap-2", !isMobile && isCollapsed && "hidden")}>
           <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                className="h-8 w-8"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M25.8333 11.6667L11.6667 11.6667C10.2 11.6667 9 12.8667 9 14.3333V28.3333C9 29.8 10.2 31 11.6667 31H25.8333C27.3 31 28.5 29.8 28.5 28.3333V14.3333C28.5 12.8667 27.3 11.6667 25.8333 11.6667Z"
                    fill="#FBC02D"
                />
            </svg>
            <span className="text-xl font-semibold text-foreground/90 tracking-tight">
                MemoWeave
            </span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ filter, label, icon: Icon }) => {
          const isActive = activeFilter === filter && (filter === 'all' ? activeTag === '' : true);
          const buttonContent = (
             <>
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn(
                "whitespace-nowrap transition-opacity",
                !isMobile && isCollapsed && "hidden"
              )}>{label}</span>
             </>
          );
          return (
            <TooltipProvider key={filter} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-10 px-3",
                      !isMobile && isCollapsed ? "justify-center" : "justify-start"
                    )}
                    aria-label={label}
                    onClick={() => handleFilterClick(filter as any)}
                  >
                    {buttonContent}
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
            <CollapsibleTrigger className={cn("flex w-full items-center justify-between p-2 hover:bg-secondary rounded-md", isCollapsed && "hidden")}>
                <h3 className="text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap">Tags</h3>
                <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1 pt-2">
              {tags.map(tag => {
                const isActive = activeTag === tag;
                 const tagButtonContent = (
                    <>
                      <Tag className="h-5 w-5 shrink-0" />
                      <span className={cn(
                        "truncate whitespace-nowrap transition-opacity",
                         !isMobile && isCollapsed && "hidden"
                      )}>{tag}</span>
                    </>
                  );
                return (
                 <TooltipProvider key={tag} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button
                            variant={isActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full h-10 px-3",
                              !isMobile && isCollapsed ? "justify-center" : "justify-start"
                            )}
                            aria-label={tag}
                            onClick={() => onTagClick(tag)}
                          >
                           {tagButtonContent}
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
        "hidden sm:flex h-screen flex-col bg-card shadow-lg z-40",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-60"
      )}
    >
      <NavContent />
    </aside>
  );
}
