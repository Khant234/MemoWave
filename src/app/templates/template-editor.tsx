

"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { type NoteTemplate, type NoteCategory } from "@/lib/types";
import { useTemplates } from "@/contexts/templates-context";
import { Plus, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NOTE_CATEGORIES, NOTE_CATEGORY_TITLES } from "@/lib/constants";

type TemplateEditorProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  template: NoteTemplate | null;
};

export function TemplateEditor({ isOpen, setIsOpen, template }: TemplateEditorProps) {
  const { addTemplate, updateTemplate } = useTemplates();
  const { toast } = useToast();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [checklist, setChecklist] = React.useState<{ text: string }[]>([]);
  const [newChecklistItem, setNewChecklistItem] = React.useState("");
  const [category, setCategory] = React.useState<NoteCategory>('uncategorized');

  React.useEffect(() => {
    if (isOpen) {
        if (template) {
        setName(template.name);
        setDescription(template.description);
        setTitle(template.title || "");
        setContent(template.content);
        setChecklist(template.checklist || []);
        setCategory(template.category || 'uncategorized');
        } else {
        setName("");
        setDescription("");
        setTitle("");
        setContent("");
        setChecklist([]);
        setCategory('uncategorized');
        }
    }
  }, [template, isOpen]);

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([...checklist, { text: newChecklistItem.trim() }]);
      setNewChecklistItem("");
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const templateData = { name, description, title, content, checklist, category };

    if (template && template.id) {
      updateTemplate({ ...template, ...templateData });
      toast({ title: "Template Updated" });
    } else {
      addTemplate(templateData);
      toast({ title: "Template Created" });
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template ? "Edit Template" : "New Template"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <div className="space-y-4 pr-6">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name*</Label>
              <Input id="template-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Weekly Review" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description">Description</Label>
              <Input id="template-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description of the template" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-title">Note Title (Optional)</Label>
              <Input id="template-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Meeting Notes - [Date]" />
               <p className="text-xs text-muted-foreground">You can use `[Date]` which will be replaced with the current date.</p>
            </div>
             <div className="space-y-2">
              <Label htmlFor="template-category">Category</Label>
              <Select value={category} onValueChange={(value: NoteCategory) => setCategory(value)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                      {NOTE_CATEGORIES.map((key) => (
                          <SelectItem key={key} value={key}>{NOTE_CATEGORY_TITLES[key]}</SelectItem>
                      ))}
                  </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-content">Content</Label>
              <Textarea id="template-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="The main body of the template..." className="min-h-[150px]" />
            </div>
            <div className="space-y-2">
              <Label>Checklist Items</Label>
              <div className="space-y-2">
                {checklist.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={item.text} readOnly className="bg-secondary" />
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveChecklistItem(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newChecklistItem} onChange={(e) => setNewChecklistItem(e.target.value)} placeholder="Add checklist item text" onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()} />
                <Button onClick={handleAddChecklistItem}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Template</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
