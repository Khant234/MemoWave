
"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, ListTodo, LayoutGrid, CalendarDays, Target, User, Briefcase, Building2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { type NoteCategory } from "@/lib/types";

type AppSidebarProps = {
  activeFilter?: "all" | "archived" | "trash";
  setActiveFilter?: React.Dispatch<React.SetStateAction<"all" | "archived" | "trash">>;
  activeCategory?: NoteCategory | null;
  setActiveCategory?: React.Dispatch<React.SetStateAction<NoteCategory | null>>;
  isMobile?: boolean;
  isCollapsed?: boolean;
};

const AppSidebarComponent = ({
  activeFilter,
  setActiveFilter,
  activeCategory,
  setActiveCategory,
  isMobile,
  isCollapsed: isCollapsedFromProp,
}: AppSidebarProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const isLoading = isCollapsedFromProp === undefined;
  const isCollapsed = isLoading ? false : isCollapsedFromProp;

  const handleFilterClick = (filter: "all" | "archived" | "trash", path: string) => {
    setActiveCategory?.(null);
    if (isMobile && setActiveFilter) {
      setActiveFilter(filter);
      router.push(path);
    } else {
      router.push(path);
    }
  };
  
  const handleCategoryClick = (category: NoteCategory | null) => {
    setActiveCategory?.(category);
    if (activeFilter !== 'all' && setActiveFilter) {
      setActiveFilter('all');
    }

    const params = new URLSearchParams();
    if (category) {
      params.set('category', category);
    }
    
    router.push(`/?${params.toString()}`);
  }

  const navItems = [
    { name: "All Notes", path: "/", icon: NotepadText, filter: "all", category: null },
    { name: "To-do List", path: "/todos", icon: ListTodo },
    { name: "Kanban Board", path: "/board", icon: LayoutGrid },
    { name: "Calendar", path: "/calendar", icon: CalendarDays },
    { name: "Plans", path: "/plans", icon: Target },
    { name: "Templates", path: "/templates", icon: FileText },
    { name: "Archived", path: "/?filter=archived", icon: Archive, filter: "archived" },
    { name: "Trash", path: "/?filter=trash", icon: Trash2, filter: "trash" },
  ];

  const categoryItems: { name: string, category: NoteCategory, icon: React.ElementType }[] = [
    { name: "Personal", category: 'personal', icon: User },
    { name: "Professional", category: 'professional', icon: Briefcase },
    { name: "Business", category: 'business', icon: Building2 },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <nav className="flex flex-col gap-1 p-2 pt-4">
        {navItems.map(({ name, path, icon: Icon, filter }) => {
          let isActive = false;
          if (filter) {
            isActive = pathname === '/' && activeFilter === filter && !activeCategory;
          } else if (path === '/templates') {
            isActive = pathname.startsWith(path);
          } else {
            isActive = pathname.startsWith(path) && path !== '/';
          }
          if (path === '/') {
            isActive = pathname === '/' && activeFilter === 'all' && !activeCategory;
          }
          
          return (
            <Tooltip key={name} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={path}
                  onClick={(e) => {
                    e.preventDefault();
                    if (filter) {
                      handleFilterClick(filter as any, path);
                    } else {
                      router.push(path);
                    }
                  }}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                    isCollapsed ? "justify-center" : "justify-start"
                  )}
                  aria-label={name}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn(
                      "whitespace-nowrap transition-opacity duration-200",
                      isCollapsed && "opacity-0 hidden"
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

        <>
          <Separator className="my-2" />
          <div className="flex-1 flex flex-col min-h-0">
            <div className={cn("p-2 pt-0", isCollapsed && "hidden")}>
                <h3 className="px-2 text-xs font-semibold tracking-tight text-muted-foreground whitespace-nowrap">
                  CATEGORIES
                </h3>
            </div>
            <nav className="flex flex-col gap-1 px-2">
              {categoryItems.map(({ name, category, icon: Icon }) => {
                const isActive = activeCategory === category;
                return (
                  <Tooltip key={name} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                            "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                            isCollapsed ? "justify-center" : "justify-start"
                          )}
                        aria-label={name}
                        onClick={() => handleCategoryClick(category)}
                      >
                         <Icon className="h-5 w-5 shrink-0" />
                        <span
                          className={cn(
                            "truncate whitespace-nowrap transition-opacity duration-200",
                            isCollapsed && "opacity-0 hidden"
                          )}
                        >
                          {name}
                        </span>
                      </button>
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
          </div>
        </>
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
