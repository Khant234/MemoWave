"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  PanelLeft,
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

type AppHeaderProps = {
  searchTerm: string;
  setSearchTerm: Dispatch<SetStateAction<string>>;
  layout: "grid" | "list";
  setLayout: Dispatch<SetStateAction<"grid" | "list">>;
  onNewNote: () => void;
  activeFilter: "all" | "archived" | "trash";
  setActiveFilter: Dispatch<SetStateAction<"all" | "archived" | "trash">>;
};

export function AppHeader({
  searchTerm,
  setSearchTerm,
  layout,
  setLayout,
  onNewNote,
  activeFilter,
  setActiveFilter,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs p-0">
          <AppSidebar isMobile activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        </SheetContent>
      </Sheet>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search notes..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={layout === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setLayout("list")}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={layout === "grid" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setLayout("grid")}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <Button
          size="sm"
          className="gap-1"
          onClick={onNewNote}
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New Note</span>
        </Button>
      </div>
    </header>
  );
}
