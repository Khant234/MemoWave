
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
  SheetHeader,
  SheetTitle,
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
  activeFilter,
  setActiveFilter,
  tags,
  onTagClick,
  activeTag,
}: AppHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 shadow-sm">
      <div className="flex items-center gap-1 sm:gap-2">
         {/* Mobile Menu Toggle */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button size="icon" variant="ghost" className="sm:hidden h-10 w-10">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <AppSidebar
              isMobile
              isExpanded={false}
              setIsExpanded={() => {}}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              setSearchTerm={setSearchTerm}
              onFilterChange={() => setIsMobileMenuOpen(false)}
              tags={tags}
              onTagClick={onTagClick}
              activeTag={activeTag}
            />
          </SheetContent>
        </Sheet>
        
        <div className="flex items-center gap-2">
          <Logo />
          <span className="hidden sm:inline-block text-2xl font-semibold text-foreground/90 tracking-tight">
            MemoWeave
          </span>
        </div>
      </div>
      
      <div className="relative ml-auto flex-1 md:grow-0">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              className={cn(
                "w-full rounded-lg bg-secondary pl-10 h-12 border-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:bg-card focus-visible:border focus-visible:border-input",
                "md:w-[200px] lg:w-[400px] xl:w-[600px]"
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant={layout === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setLayout("list")}
          aria-label="List view"
          className="hidden sm:inline-flex"
        >
          <List className="h-5 w-5" />
        </Button>
        <Button
          variant={layout === "grid" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setLayout("grid")}
          aria-label="Grid view"
          className="hidden sm:inline-flex"
        >
          <LayoutGrid className="h-5 w-5" />
        </Button>
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
