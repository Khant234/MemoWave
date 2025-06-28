
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, PenSquare, Trash2, Tag, Menu } from "lucide-react";
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
  isExpanded: boolean;
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
  isExpanded,
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

  const Logo = () => (
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
      <path
        d="M18.75 22.5C20.5784 22.5 22.0833 21.0312 22.0833 19.1667C22.0833 17.3021 20.5784 15.8333 18.75 15.8333C16.9216 15.8333 15.4167 17.3021 15.4167 19.1667C15.4167 21.0312 16.9216 22.5 18.75 22.5Z"
        fill="white"
      />
      <path
        d="M15.4167 25H22.0833C22.4667 25 22.9167 24.5 22.9167 24.1667C22.9167 23.8333 22.4667 23.3333 22.0833 23.3333H15.4167C15.0333 23.3333 14.5833 23.8333 14.5833 24.1667C14.5833 24.5 15.0333 25 15.4167 25Z"
        fill="white"
      />
    </svg>
  );

  if (isMobile) {
    return (
      <nav className="grid gap-1 p-4 font-medium">
        <div className="flex items-center gap-2 px-1 pb-2 mb-2 text-lg font-semibold border-b">
          <Logo />
          <span>MemoWeave</span>
        </div>
        <Button
          variant={activeFilter === 'all' && activeTag === '' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFilterClick('all')}
        >
          <NotepadText className="mr-2 h-4 w-4" />
          <span>All Notes</span>
        </Button>
        <Button
          variant={activeFilter === 'archived' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFilterClick('archived')}
        >
          <Archive className="mr-2 h-4 w-4" />
          <span>Archived</span>
        </Button>
        <Button
          variant={activeFilter === 'trash' ? 'secondary' : 'ghost'}
          className="w-full justify-start"
          onClick={() => handleFilterClick('trash')}
        >
          <Trash2 className="mr-2 h-4 w-4" />
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
                  <Tag className="mr-2 h-4 w-4" />
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
        "z-20 fixed inset-y-0 left-0 hidden flex-col border-r bg-background sm:flex transition-[width] duration-300 ease-in-out",
        isExpanded ? "w-72" : "w-20"
      )}
    >
      <div className="flex flex-col h-full py-2">
        <nav className={cn("flex flex-col gap-1 px-2.5")}>
          {mainNavItems.map(({ filter, label, icon: Icon, active }) => (
            <Button
              key={filter}
              variant="ghost"
              className={cn(
                  "w-full h-12 justify-start",
                  active ? "bg-secondary font-semibold" : "font-normal",
                  isExpanded ? 'px-4 rounded-r-full rounded-l-none' : 'w-12 justify-center rounded-full'
              )}
              aria-label={label}
              onClick={() => handleFilterClick(filter as any)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={cn("ml-4", !isExpanded && "sr-only")}>{label}</span>
            </Button>
          ))}
        </nav>

        {tags.length > 0 && (
           <div className="flex flex-col gap-1 mt-4 pt-4 border-t px-2.5">
             {isExpanded && (
                 <h3 className="px-4 pb-2 text-sm font-semibold text-muted-foreground tracking-tight">Tags</h3>
            )}
            {tags.map(tag => (
                <Button
                  key={tag}
                  variant="ghost"
                  className={cn(
                    "w-full h-12 justify-start",
                    activeTag === tag ? "bg-secondary font-semibold" : "font-normal",
                    isExpanded ? 'px-4 rounded-r-full rounded-l-none' : 'w-12 justify-center rounded-full'
                  )}
                  aria-label={tag}
                  onClick={() => onTagClick(tag)}
                >
                  <Tag className="h-5 w-5 shrink-0" />
                  <span className={cn("ml-4 truncate", !isExpanded && "sr-only")}>{tag}</span>
                </Button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
