"use client";

import { type NoteTemplate } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NOTE_CATEGORY_TITLES } from "@/lib/constants";

type TemplateCardProps = {
  template: NoteTemplate;
  onEdit: (template: NoteTemplate) => void;
  onDelete: (templateId: string) => void;
};

export function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  return (
    <Card className="flex flex-col h-full shadow-soft">
      <CardHeader>
        <CardTitle className="font-headline">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {template.category && <Badge variant="outline">{NOTE_CATEGORY_TITLES[template.category]}</Badge>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        {template.isCustom ? (
          <>
            <Button variant="ghost" size="icon" onClick={() => onEdit(template)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit Template</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(template.id)} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete Template</span>
            </Button>
          </>
        ) : (
           <Badge variant="secondary">Default</Badge>
        )}
      </CardFooter>
    </Card>
  );
}
