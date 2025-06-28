
"use client";

import type { Dispatch, SetStateAction } from "react";
import * as React from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AppSidebar } from "./app-sidebar";
import { cn } from "@/lib/utils";


type AppHeaderProps = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  layout: "grid" | "list";
  setLayout: Dispatch<SetStateAction<"grid" | "list">>;
  onNewNote: () => void;
  onToggleSidebar: () => void;
  activeFilter: "all" | "archived" | "trash";
  setActiveFilter: Dispatch<SetStateAction<"all" | "archived" | "trash">>;
  tags: string[];
  onTagClick: (tag: string) => void;
  activeTag: string;
};

export function AppHeader({
  searchTerm,
  setSearchTerm,
  layout,
  setLayout,
  onNewNote,
  onToggleSidebar,
  activeFilter,
  setActiveFilter,
  tags,
  onTagClick,
  activeTag,
}: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-2">
         {/* Desktop Menu Toggle */}
         <Button size="icon" variant="ghost" className="hidden sm:flex h-10 w-10" onClick={onToggleSidebar}>
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
         {/* Mobile Menu Toggle */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden h-10 w-10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs p-0 bg-card">
            <AppSidebar
              isMobile
              activeFilter={activeFilter}
              setActiveFilter={(filter) => {
                setActiveFilter(filter);
                setIsMobileMenuOpen(false);
              }}
              setSearchTerm={(term) => {
                setSearchTerm(term);
                setIsMobileMenuOpen(false);
              }}
              tags={tags}
              onTagClick={(tag) => {
                onTagClick(tag);
                setIsMobileMenuOpen(false);
              }}
              activeTag={activeTag}
            />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
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
            <span className="text-xl font-semibold text-foreground/90 tracking-tight">
                MemoWeave
            </span>
        </div>
      </div>
      
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              className={cn(
                "w-full rounded-lg bg-secondary pl-10 h-12 border-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-card focus-visible:border focus-visible:border-input",
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1 rounded-lg bg-secondary p-0.5 sm:flex">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout("list")}
              aria-label="List view"
              className={cn(
                "w-9 px-0",
                layout === "list" && "bg-background text-foreground shadow-sm hover:bg-background"
              )}
            >
              <List className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLayout("grid")}
              aria-label="Grid view"
              className={cn(
                "w-9 px-0",
                layout === "grid" && "bg-background text-foreground shadow-sm hover:bg-background"
              )}
            >
              <LayoutGrid className="h-5 w-5" />
            </Button>
          </div>
        <ThemeToggle />
        <Button
          size="sm"
          className="gap-1 hidden sm:inline-flex"
          onClick={onNewNote}
        >
          <Plus className="h-4 w-4" />
          <span>New Note</span>
        </Button>
      </div>
    </header>
  );
}
