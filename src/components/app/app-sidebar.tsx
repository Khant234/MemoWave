
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ filter, label, icon: Icon }) => {
            const isActive = activeFilter === filter && (filter === 'all' ? activeTag === '' : true);
            return (
              <Button
                key={filter}
                variant={isActive ? 'secondary' : 'ghost'}
                className="relative h-12 justify-start px-4"
                aria-label={label}
                onClick={() => handleFilterClick(filter as any)}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                )}
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(
                  "ml-4 whitespace-nowrap transition-opacity",
                  !isMobile && "opacity-0 group-hover:opacity-100"
                )}>{label}</span>
              </Button>
            );
          })}
        </nav>

        {tags.length > 0 && (
           <div className="flex flex-col gap-1 p-2 mt-2 border-t">
             <h3 className={cn(
                "px-4 pb-2 text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap transition-opacity",
                 !isMobile && "opacity-0 group-hover:opacity-100"
              )}>Tags</h3>
            {tags.map(tag => {
              const isActive = activeTag === tag;
              return (
                <Button
                  key={tag}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="relative h-12 justify-start px-4"
                  aria-label={tag}
                  onClick={() => onTagClick(tag)}
                >
                   {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-primary" />
                  )}
                  <Tag className="h-5 w-5 shrink-0" />
                  <span className={cn(
                    "ml-4 truncate whitespace-nowrap transition-opacity",
                     !isMobile && "opacity-0 group-hover:opacity-100"
                    )}>{tag}</span>
                </Button>
              )
            })}
          </div>
        )}
    </div>
  )

  if (isMobile) {
    return <NavContent />;
  }
  
  return (
    <aside
      className={cn(
        "group hidden sm:flex flex-col bg-card shadow-lg",
        "transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden",
        "w-20 hover:w-72 h-[calc(100vh-4rem)]"
      )}
    >
        <NavContent />
    </aside>
  );
}
