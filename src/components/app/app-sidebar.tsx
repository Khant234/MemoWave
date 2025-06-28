
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
      <div className={cn(
          "flex items-center gap-2 p-4 shrink-0",
          isMobile ? 'border-b' : 'h-16' // Match header height on desktop
      )}>
         <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            className="h-8 w-8 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M25.8333 11.6667L11.6667 11.6667C10.2 11.6667 9 12.8667 9 14.3333V28.3333C9 29.8 10.2 31 11.6667 31H25.8333C27.3 31 28.5 29.8 28.5 28.3333V14.3333C28.5 12.8667 27.3 11.6667 25.8333 11.6667Z"
              fill="#FBC02D"
            />
            <path
              d="M18.75 22.5C20.5784 22.5 22.0833 21.0312 22.0833 19.1667C22.0833 17.3021 20.5784 15.8333 18.75 15.8333C16.9216 15.8333 15.4167 17.3021 15.4167 19.1667C15.4167 21.0312 16.9216 22.5 18.75 22.5Z"
              fill="white"
            />
            <path
              d="M15.4167 25H22.0833C22.4667 25 22.9167 24.5 22.9167 24.1667C22.9167 23.8333 22.4667 23.3333 22.0833 23.3333H15.4167C15.0333 23.3333 14.5833 23.8333 14.5833 24.1667C14.5833 24.5 15.0333 25 15.4167 25Z"
              fill="white"
            />
          </svg>
        <span className={cn(
          "text-xl font-semibold text-foreground/90 tracking-tight whitespace-nowrap transition-opacity",
          // On desktop, hide text when collapsed
          !isMobile && "opacity-0 group-hover/sidebar:opacity-100"
        )}>MemoWeave</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
          {navItems.map(({ filter, label, icon: Icon }) => {
            const isActive = activeFilter === filter && (filter === 'all' ? activeTag === '' : true);
            return (
              <Button
                key={filter}
                variant={isActive ? 'secondary' : 'ghost'}
                className="h-12 justify-start px-4"
                aria-label={label}
                onClick={() => handleFilterClick(filter as any)}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(
                  "ml-4 whitespace-nowrap transition-opacity",
                  !isMobile && "opacity-0 group-hover/sidebar:opacity-100"
                )}>{label}</span>
              </Button>
            );
          })}
        </nav>

        {tags.length > 0 && (
           <div className="flex flex-col gap-1 p-2 mt-2 border-t">
             <h3 className={cn(
                "px-4 pb-2 text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap transition-opacity",
                 !isMobile && "opacity-0 group-hover/sidebar:opacity-100"
              )}>Tags</h3>
            {tags.map(tag => {
              const isActive = activeTag === tag;
              return (
                <Button
                  key={tag}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="h-12 justify-start px-4"
                  aria-label={tag}
                  onClick={() => onTagClick(tag)}
                >
                  <Tag className="h-5 w-5 shrink-0" />
                  <span className={cn(
                    "ml-4 truncate whitespace-nowrap transition-opacity",
                     !isMobile && "opacity-0 group-hover/sidebar:opacity-100"
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
      // Add group/sidebar to control child visibility on hover
      className={cn(
        "group/sidebar",
        "fixed top-0 left-0 h-screen z-40 hidden sm:flex flex-col bg-background shadow-lg",
        // Transition for width
        "transition-all duration-300 ease-in-out overflow-x-hidden",
        // Collapsed and expanded widths
        "w-20 hover:w-72"
      )}
    >
        <NavContent />
    </aside>
  );
}
