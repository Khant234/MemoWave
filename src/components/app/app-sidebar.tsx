
"use client";

import * as React from "react";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
import { NotepadText, Archive, Trash2, Tag, ListTodo, LayoutGrid, CalendarDays, Target, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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


// --- Nested Tags Logic ---

type TagNode = {
  name: string;
  path: string;
  children: TagNode[];
};

const buildTagTree = (tags: string[]): TagNode[] => {
  const tree: TagNode[] = [];
  const levelMap: Record<string, TagNode> = {};

  const allPaths = new Set<string>();
  tags.forEach(tag => {
    const parts = tag.split('/');
    for (let i = 1; i <= parts.length; i++) {
      allPaths.add(parts.slice(0, i).join('/'));
    }
  });

  const sortedPaths = Array.from(allPaths).sort();

  sortedPaths.forEach(path => {
    const parts = path.split('/');
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join('/');

    const node: TagNode = {
      name,
      path,
      children: [],
    };

    levelMap[path] = node;

    if (parentPath && levelMap[parentPath]) {
      levelMap[parentPath].children.push(node);
    } else {
      tree.push(node);
    }
  });

  return tree;
};

const TagNodeDisplay: React.FC<{
  node: TagNode;
  level: number;
  handleTagClick: (tagPath: string) => void;
  activeTag?: string;
  isMobile?: boolean;
  isCollapsed?: boolean;
}> = ({ node, level, handleTagClick, activeTag, isMobile, isCollapsed }) => {
  const searchString = node.path.includes(' ') ? `"#${node.path}"` : `#${node.path}`;
  const isExactActive = activeTag === searchString;
  // A tag is considered "active" if it's the one selected, or if the selected tag is one of its children.
  const isActive = activeTag ? activeTag.startsWith(searchString) : false;
  const hasChildren = node.children.length > 0;

  const button = (
    <Button
      variant={isExactActive ? "secondary" : "ghost"}
      className={cn(
        "h-10 px-2 w-full text-left font-normal",
        !isMobile && isCollapsed ? "justify-center" : "justify-start",
        isActive && !isExactActive && "bg-accent/50"
      )}
      aria-label={node.name}
      onClick={() => handleTagClick(node.path)}
    >
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
            <Tag className={cn("h-5 w-5 shrink-0 transition-all duration-200 text-muted-foreground", isActive && "text-primary")} />
            
            <span className={cn("truncate whitespace-nowrap transition-opacity", !isMobile && isCollapsed && "hidden")}>
                {node.name}
            </span>

            {hasChildren && !isCollapsed && (
                <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-200 ml-auto group-data-[state=open]/collapsible:rotate-90" />
            )}
        </div>
    </Button>
  );

  const getButton = () => {
    if (hasChildren && !isCollapsed) {
        return <CollapsibleTrigger asChild>{button}</CollapsibleTrigger>
    }
    return button;
  }
  
  const content = (
      <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            {getButton()}
          </TooltipTrigger>
          {isCollapsed && !isMobile && (
              <TooltipContent side="right"><p>{node.path}</p></TooltipContent>
          )}
      </Tooltip>
  );

  if (!hasChildren) {
    return (
        <div style={{ paddingLeft: !isMobile && isCollapsed ? 0 : `${level * 1}rem`}}>
          {content}
        </div>
    );
  }

  return (
    <Collapsible className="group/collapsible">
        <div style={{ paddingLeft: !isMobile && isCollapsed ? 0 : `${level * 1}rem` }}>
          {content}
        </div>
        <CollapsibleContent>
            {node.children.map(child => (
            <TagNodeDisplay
                key={child.path}
                node={child}
                level={level + 1}
                handleTagClick={handleTagClick}
                activeTag={activeTag}
                isMobile={isMobile}
                isCollapsed={isCollapsed}
            />
            ))}
        </CollapsibleContent>
    </Collapsible>
  );
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

  const tagTree = React.useMemo(() => buildTagTree(tags), [tags]);

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
                    buttonVariants({ variant: isActive ? "secondary" : "ghost", size: 'default' }),
                    "w-full h-10 px-3 group",
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
                {tagTree.map(node => (
                  <TagNodeDisplay
                    key={node.path}
                    node={node}
                    level={0}
                    handleTagClick={handleTagClick}
                    activeTag={activeTag}
                    isMobile={isMobile}
                    isCollapsed={isCollapsed}
                  />
                ))}
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
