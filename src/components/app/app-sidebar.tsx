
"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag, ChevronDown, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AppSidebarProps = {
  activeFilter?: "all" | "archived" | "trash";
  setActiveFilter?: React.Dispatch<React.SetStateAction<"all" | "archived" | "trash">>;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  onTagClick?: (tag: string) => void;
  activeTag?: string;
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
  const pathname = usePathname();
  const router = useRouter();

  const handleFilterClick = (filter: "all" | "archived" | "trash") => {
    const href = filter === 'all' ? '/' : `/?filter=${filter}`;
    router.push(href);
  };

  const handleTagClick = (tag: string) => {
    if (pathname === '/') {
      onTagClick?.(tag);
    } else {
      router.push(`/?q=${tag}`);
    }
  }

  const navItems = [
    { filter: "all", label: "All Notes", icon: NotepadText },
    { filter: "archived", label: "Archived", icon: Archive },
    { filter: "trash", label: "Trash", icon: Trash2 },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {navItems.map(({ filter, label, icon: Icon }) => {
          const isActive = pathname === '/' && activeFilter === filter && !activeTag;
          return (
            <Tooltip key={filter} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
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
              </TooltipTrigger>
              {isCollapsed && !isMobile && (
                <TooltipContent side="right">
                  <p>{label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Link href="/todos" passHref>
              <Button
                variant={pathname.startsWith('/todos') ? "secondary" : "ghost"}
                className={cn(
                  "w-full h-10 px-3 group",
                  !isMobile && isCollapsed ? "justify-center" : "justify-start"
                )}
                aria-label="To-do List"
              >
                <ListTodo className={cn(
                  "h-5 w-5 shrink-0 transition-all duration-200",
                  pathname.startsWith('/todos') ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                  "group-hover:-translate-y-0.5"
                )} />
                <span className={cn(
                  "whitespace-nowrap transition-opacity",
                  !isMobile && isCollapsed && "hidden"
                )}>To-do List</span>
              </Button>
            </Link>
          </TooltipTrigger>
          {isCollapsed && !isMobile && (
            <TooltipContent side="right">
              <p>To-do List</p>
            </TooltipContent>
          )}
        </Tooltip>
      </nav>

      {tags.length > 0 && (
        <>
          <Separator className={cn("mx-4 my-1", isCollapsed && "hidden")} />
           <Collapsible defaultOpen className="p-2">
            <CollapsibleTrigger asChild>
                <button className={cn("flex w-full items-center justify-between p-2 hover:bg-secondary rounded-md", isCollapsed && "hidden")}>
                    <h3 className="text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap">Tags</h3>
                    <ChevronDown className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-180" />
                </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-1 pt-2">
              {tags.map(tag => {
                const isActive = pathname === '/' && activeTag === tag;
                return (
                  <Tooltip key={tag} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full h-10 px-3 group",
                          !isMobile && isCollapsed ? "justify-center" : "justify-start"
                        )}
                        aria-label={tag}
                        onClick={() => handleTagClick(tag)}
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
                    </TooltipTrigger>
                    {isCollapsed && !isMobile && (
                      <TooltipContent side="right">
                        <p>{tag}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
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
