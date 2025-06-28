"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, PenSquare, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  activeFilter: "all" | "archived" | "trash";
  setActiveFilter: React.Dispatch<React.SetStateAction<"all" | "archived" | "trash">>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  onTagClick: (tag: string) => void;
  activeTag: string;
  isMobile?: boolean;
  onFilterChange?: () => void;
  isExpanded?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export function AppSidebar({
  activeFilter,
  setActiveFilter,
  setSearchTerm,
  tags,
  onTagClick,
  activeTag,
  isMobile,
  onFilterChange,
  isExpanded = false,
  onMouseEnter,
  onMouseLeave,
}: AppSidebarProps) {
  const handleFilterClick = (filter: "all" | "archived" | "trash") => {
    setActiveFilter(filter);
    setSearchTerm("");
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
      <nav className="grid gap-1 p-4 font-medium">
        <div className="flex items-center gap-2 px-1 pb-2 mb-2 text-lg font-semibold border-b">
          <PenSquare className="h-6 w-6" />
          <span>MemoWeave</span>
        </div>
        <Button
          variant={activeFilter === 'all' && activeTag === '' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFilterClick('all')}
        >
          <NotepadText className="h-4 w-4" />
          <span>All Notes</span>
        </Button>
        <Button
          variant={activeFilter === 'archived' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFilterClick('archived')}
        >
          <Archive className="h-4 w-4" />
          <span>Archived</span>
        </Button>
        <Button
          variant={activeFilter === 'trash' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFilterClick('trash')}
        >
          <Trash2 className="h-4 w-4" />
          <span>Trash</span>
        </Button>

        {tags.length > 0 && (
          <div className="pt-4 mt-2 border-t">
            <h3 className="px-2 pb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Tags</h3>
            <div className="flex flex-col gap-1">
              {tags.map((tag) => (
                <Button
                  key={tag}
                  variant={activeTag === tag ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => handleTagClick(tag)}
                >
                  <Tag className="h-4 w-4" />
                  <span className="truncate">{tag}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </nav>
    );
  }
  
  const mainNavItems = [
    { filter: "all", label: "All Notes", icon: NotepadText, active: activeFilter === "all" && activeTag === '' },
    { filter: "archived", label: "Archived", icon: Archive, active: activeFilter === "archived" },
    { filter: "trash", label: "Trash", icon: Trash2, active: activeFilter === "trash" },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-background sm:flex transition-[width] duration-300 ease-in-out",
        isExpanded ? "w-64" : "w-14"
      )}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <nav className={cn("flex flex-col gap-4 px-2 py-4", isExpanded ? "items-stretch" : "items-center")}>
        <div className={cn(
            "group flex h-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:text-base",
            isExpanded ? "w-auto self-start px-3" : "w-9"
        )}>
            <PenSquare className="h-5 w-5 transition-all group-hover:scale-110 shrink-0" />
            {isExpanded && <span className="ml-1">MemoWeave</span>}
            {!isExpanded && <span className="sr-only">MemoWeave</span>}
        </div>
        
        {mainNavItems.map(({ filter, label, icon: Icon, active }) => (
          <Button
            key={filter}
            variant={active ? "secondary" : "ghost"}
            size={isExpanded ? "default" : "icon"}
            className={cn(
                "w-full rounded-lg",
                active && "bg-primary/10 text-primary",
                isExpanded ? "justify-start" : "justify-center"
            )}
            aria-label={label}
            onClick={() => handleFilterClick(filter as any)}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {isExpanded && <span className="ml-2">{label}</span>}
          </Button>
        ))}
      </nav>
      {tags.length > 0 && (
        <nav className={cn("mt-auto flex flex-col gap-4 px-2 py-4 border-t", isExpanded ? "items-stretch" : "items-center")}>
          {isExpanded && (
               <h3 className="px-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Tags</h3>
          )}
          
          {tags.map(tag => (
              <Button
                key={tag}
                variant={activeTag === tag ? "secondary" : "ghost"}
                size={isExpanded ? "default" : "icon"}
                className={cn(
                  "w-full rounded-lg",
                  activeTag === tag && "bg-primary/10 text-primary",
                  isExpanded ? "justify-start" : "justify-center"
                )}
                aria-label={tag}
                onClick={() => onTagClick(tag)}
              >
                <Tag className="h-5 w-5 shrink-0" />
                {isExpanded && <span className="ml-2 truncate">{tag}</span>}
              </Button>
          ))}
        </nav>
      )}
    </aside>
  );
}
