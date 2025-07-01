
"use client";

import * as React from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Menu,
  Mic,
  ArrowLeft,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClickSound } from "@/hooks/use-click-sound";
import { useIsMobile } from "@/hooks/use-mobile";


type AppHeaderProps = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  layout?: "grid" | "list";
  setLayout?: Dispatch<SetStateAction<"grid" | "list">>;
  onNewNote?: () => void;
  onNewVoiceNote?: () => void;
  onToggleSidebar: () => void;
  activeFilter?: "all" | "archived" | "trash";
  setActiveFilter?: Dispatch<SetStateAction<"all" | "archived" | "trash">>;
  tags: string[];
  onTagClick?: (tag: string) => void;
  activeTag?: string;
};

const AppHeaderComponent = ({
  searchTerm,
  setSearchTerm,
  layout,
  setLayout,
  onNewNote,
  onNewVoiceNote,
  onToggleSidebar,
  activeFilter,
  setActiveFilter,
  tags,
  onTagClick,
  activeTag,
}: AppHeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = React.useState(false);
  const playClickSound = useClickSound();
  const isMobile = useIsMobile();

  React.useEffect(() => {
    if (!isMobile && isMobileSearchOpen) {
        setIsMobileSearchOpen(false);
    }
  }, [isMobile, isMobileSearchOpen]);

  const handleMobileMenuOpenChange = (open: boolean) => {
    if (open) {
      playClickSound();
    }
    setIsMobileMenuOpen(open);
  }

  if (isMobile && isMobileSearchOpen) {
    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/40 bg-card/80 px-4 backdrop-blur-lg">
            <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => setIsMobileSearchOpen(false)}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Close Search</span>
            </Button>
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search notes..."
                    className="h-10 w-full rounded-full border-transparent bg-secondary pl-10 focus-visible:bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
        </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-lg sm:px-6">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" className="hidden sm:flex h-10 w-10" onClick={onToggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
        </Button>
        <Sheet open={isMobileMenuOpen} onOpenChange={handleMobileMenuOpenChange}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden h-10 w-10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs p-0 bg-card">
            <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription className="sr-only">Main menu for mobile navigation</SheetDescription>
            </SheetHeader>
            <AppSidebar
              isMobile
              activeFilter={activeFilter}
              setActiveFilter={(filter) => {
                setActiveFilter?.(filter);
                setIsMobileMenuOpen(false);
              }}
              setSearchTerm={(term) => {
                setSearchTerm(term);
                setIsMobileMenuOpen(false);
              }}
              tags={tags}
              onTagClick={(tag) => {
                onTagClick?.(tag);
                setIsMobileMenuOpen(false);
              }}
              activeTag={activeTag}
            />
          </SheetContent>
        </Sheet>
        
        <div className="hidden items-center gap-2 md:flex">
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary"
            >
                <path
                d="M10 4H4C3.44772 4 3 4.44772 3 5V19C3 19.5523 3.44772 20 4 20H10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M14 20H20C20.5523 20 21 19.5523 21 19V5C21 4.44772 20.5523 4 20 4H14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M7 16H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M7 12H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
                <path
                d="M7 8H17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
            </svg>
            <span className="font-headline text-xl font-bold text-foreground/90 tracking-tight">
                MemoWeave
            </span>
        </div>
      </div>
      
      <div className="hidden flex-1 items-center justify-center sm:flex">
        <div className="relative w-full max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes, or type # for tags..."
              className={cn(
                "w-full rounded-full bg-secondary pl-11 h-10 border-transparent transition-all duration-200 ease-in-out",
                "focus-visible:bg-background focus-visible:shadow-inner"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      <div className="flex items-center gap-2 ml-auto sm:ml-0">
         <Button variant="ghost" size="icon" className="h-10 w-10 sm:hidden" onClick={() => setIsMobileSearchOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
        </Button>

        <div className="hidden items-center gap-2 sm:flex">
            {layout && setLayout && (
            <div className="hidden items-center gap-1 rounded-lg bg-secondary p-0.5 sm:flex">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                        variant={layout === "list" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setLayout("list")}
                        aria-label="List view"
                        className="w-9 px-0"
                        >
                        <List className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>List View</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                        variant={layout === "grid" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setLayout("grid")}
                        aria-label="Grid view"
                        className="w-9 px-0"
                        >
                        <LayoutGrid className="h-5 w-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Grid View</p>
                    </TooltipContent>
                </Tooltip>
                </div>
            )}

            {onNewVoiceNote && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="hidden sm:inline-flex"
                            onClick={onNewVoiceNote}
                        >
                            <Mic className="h-5 w-5" />
                            <span className="sr-only">New Voice Note</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>New Voice Note</p>
                    </TooltipContent>
                </Tooltip>
            )}
            {onNewNote && (
                <Button
                size="sm"
                className="gap-1 hidden sm:inline-flex"
                onClick={onNewNote}
                >
                <Plus className="h-4 w-4" />
                <span>New Note</span>
                </Button>
            )}
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
export const AppHeader = React.memo(AppHeaderComponent);
