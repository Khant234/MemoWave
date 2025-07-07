"use client";

import { type NoteTemplate } from "@/lib/types";
import { TemplateCard } from "./template-card";
import { FileText } from "lucide-react";

type TemplateListProps = {
  templates: NoteTemplate[];
  onEdit: (template: NoteTemplate) => void;
  onDelete: (templateId: string) => void;
};

export function TemplateList({ templates, onEdit, onDelete }: TemplateListProps) {
  const defaultTemplates = templates.filter(t => !t.isCustom);
  const customTemplates = templates.filter(t => t.isCustom);

  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 rounded-lg bg-background/50 border-2 border-dashed h-[calc(100vh-250px)]">
        <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
          <FileText className="h-12 w-12" />
        </div>
        <h2 className="text-2xl font-semibold mb-2 font-headline">No Templates Found</h2>
        <p className="text-muted-foreground max-w-sm">
          Click "New Template" to create your first one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {customTemplates.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-headline mb-4">My Templates</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {customTemplates.map(template => (
              <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
      
      {defaultTemplates.length > 0 && (
        <div>
          <h2 className="text-xl font-bold font-headline mb-4">Default Templates</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {defaultTemplates.map(template => (
              <TemplateCard key={template.id} template={template} onEdit={onEdit} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
