"use client";

import * as React from "react";
import { AppHeader } from "@/components/app/app-header";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useTemplates } from "@/contexts/templates-context";
import { type NoteTemplate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import { TemplateEditor } from "./template-editor";
import { TemplateList } from "./template-list";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { TemplatesPageSkeleton } from "./templates-page-skeleton";
import { AiTemplateGenerator } from "./ai-template-generator";

export default function TemplatesPage() {
  const { isCollapsed: isSidebarCollapsed, toggleSidebar } = useSidebar();
  const { templates, deleteTemplate, isLoading } = useTemplates();
  const { toast } = useToast();
  
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<NoteTemplate | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = React.useState<string | null>(null);
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = React.useState(false);

  const handleNewTemplate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleAiGenerate = () => {
    setIsAiGeneratorOpen(true);
  };

  const handleEditTemplate = (template: NoteTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setDeletingTemplateId(templateId);
  };

  const confirmDelete = () => {
    if (deletingTemplateId) {
      deleteTemplate(deletingTemplateId);
      toast({
        title: "Template Deleted",
        description: "The template has been permanently deleted.",
      });
      setDeletingTemplateId(null);
    }
  };

  return (
    <>
      <div className="flex h-screen w-full flex-col bg-secondary">
        <AppHeader onToggleSidebar={toggleSidebar} searchTerm="" setSearchTerm={() => {}} />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar isCollapsed={isSidebarCollapsed} />
          <main className="flex-1 overflow-y-auto bg-background p-4 sm:p-8 transition-all duration-300 ease-in-out">
            <div className="mx-auto max-w-5xl">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold font-headline">Manage Templates</h1>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleAiGenerate}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with AI
                  </Button>
                  <Button onClick={handleNewTemplate}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Template
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <TemplatesPageSkeleton />
              ) : (
                <TemplateList 
                  templates={templates} 
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                />
              )}

            </div>
          </main>
        </div>
      </div>

      <TemplateEditor
        isOpen={isEditorOpen}
        setIsOpen={setIsEditorOpen}
        template={editingTemplate}
      />

      <AiTemplateGenerator
        open={isAiGeneratorOpen}
        setOpen={setIsAiGeneratorOpen}
        onEdit={handleEditTemplate}
      />

      <AlertDialog open={!!deletingTemplateId} onOpenChange={(open) => !open && setDeletingTemplateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
