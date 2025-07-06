
"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag, ListTodo, LayoutGrid, CalendarDays, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

const AppSidebarComponent = ({
  activeFilter,
  setActiveFilter,
  setSearchTerm,
  tags,
  onTagClick,
  activeTag,
  isMobile,
  isCollapsed: isCollapsedFromProp,
}: AppSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isLoading = isCollapsedFromProp === undefined;
  const isCollapsed = isLoading ? true : isCollapsedFromProp;

  const handleTagClick = (tag: string) => {
    const searchString = tag.includes(' ') ? `"#${tag}"` : `#${tag}`;
    if (pathname === '/') {
        onTagClick?.(searchString);
    } else {
      router.push(`/?q=${encodeURIComponent(searchString)}`);
    }
  }

  const navItems = [
    { name: "All Notes", path: "/", icon: NotepadText, filter: "all" },
    { name: "To-do List", path: "/todos", icon: ListTodo },
    { name: "Kanban Board", path: "/board", icon: LayoutGrid },
    { name: "Calendar", path: "/calendar", icon: CalendarDays },
    { name: "Plans", path: "/plans", icon: Target },
    { name: "Archived", path: "/?filter=archived", icon: Archive, filter: "archived" },
    { name: "Trash", path: "/?filter=trash", icon: Trash2, filter: "trash" },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {navItems.map(({ name, path, icon: Icon, filter }) => {
          let isActive = false;
          if (filter) {
            const searchParams = new URLSearchParams(path.split('?')[1]);
            const filterParam = searchParams.get('filter') || 'all';
            isActive = pathname === '/' && activeFilter === filterParam && !activeTag;
          } else {
            isActive = pathname.startsWith(path);
          }
          
          const handleClick = (e: React.MouseEvent) => {
            e.preventDefault();
            if (isMobile) {
                if (filter) setActiveFilter?.(filter as any);
                router.push(path);
            } else {
                router.push(path);
            }
          };

          return (
            <Tooltip key={name} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={path}
                  onClick={handleClick}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors group",
                    isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                    !isMobile && isCollapsed ? "justify-center" : "justify-start"
                  )}
                  aria-label={name}
                >
                  <Icon className={cn(
                      "h-5 w-5 shrink-0 transition-all duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                      "group-hover:-translate-y-0.5"
                  )} />
                  <span className={cn(
                      "whitespace-nowrap transition-opacity",
                      !isMobile && isCollapsed && "hidden"
                  )}>{name}</span>
                </Link>
              </TooltipTrigger>
              {isCollapsed && !isMobile && (
                <TooltipContent side="right">
                  <p>{name}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
      </nav>

      {tags.length > 0 && (
        <>
          <Separator className={cn("my-2", isCollapsed ? 'mx-auto w-12' : 'mx-2' )} />
          <div className="flex-1 flex flex-col min-h-0">
            {!isCollapsed && (
              <div className={cn("p-2 pt-0", isCollapsed && 'hidden')}>
                <h3 className="text-sm font-semibold text-muted-foreground tracking-tight whitespace-nowrap px-2">
                  Tags
                </h3>
              </div>
            )}
            <ScrollArea className="flex-grow">
              <nav className="flex flex-col gap-1 px-2">
                {tags.map(tag => {
                  const searchString = tag.includes(' ') ? `"#${tag}"` : `#${tag}`;
                  const isActive = activeTag === searchString;

                  return (
                    <Tooltip key={tag} delayDuration={0}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isActive ? "secondary" : "ghost"}
                          className={cn(
                            "h-10 px-3 w-full text-left font-normal",
                            !isMobile && isCollapsed ? "justify-center" : "justify-start"
                          )}
                          aria-label={tag}
                          onClick={() => handleTagClick(tag)}
                        >
                          <div className="flex items-center gap-2 flex-1 overflow-hidden">
                            <Tag className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("truncate whitespace-nowrap transition-opacity", !isMobile && isCollapsed && "hidden")}>
                              {tag}
                            </span>
                          </div>
                        </Button>
                      </TooltipTrigger>
                      {isCollapsed && !isMobile && (
                        <TooltipContent side="right"><p>{tag}</p></TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>
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
        !isLoading && "transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-60"
      )}
    >
      <NavContent />
    </aside>
  );
}
export const AppSidebar = React.memo(AppSidebarComponent);
