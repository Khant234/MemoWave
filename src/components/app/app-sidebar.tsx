
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
            <Button
              key={filter}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "w-full h-10 px-3 group",
                !isMobile && isCollapsed ? "justify-center" : "justify-start"
              )}
              aria-label={label}
              onClick={() => handleFilterClick(filter as any)}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                "group-hover:-translate-y-0.5"
              )} />
              <span className={cn(
                "whitespace-nowrap transition-opacity",
                !isMobile && isCollapsed && "hidden"
              )}>{label}</span>
            </Button>
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
                  <Button
                    key={tag}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full h-10 px-3 group",
                      !isMobile && isCollapsed ? "justify-center" : "justify-start"
                    )}
                    aria-label={tag}
                    onClick={() => onTagClick(tag)}
                  >
                    <Tag className={cn(
                      "h-5 w-5 shrink-0 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                      "group-hover:-translate-y-0.5"
                    )} />
                    <span className={cn(
                      "truncate whitespace-nowrap transition-opacity",
                      !isMobile && isCollapsed && "hidden"
                    )}>{tag}</span>
                  </Button>
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
        "hidden sm:flex h-full flex-col bg-card z-40 border-r",
        "transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-60"
      )}
    >
      <NavContent />
    </aside>
  );
}
