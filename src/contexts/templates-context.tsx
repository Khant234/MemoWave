'use client';

import * as React from 'react';
import { type NoteTemplate } from '@/lib/types';
import { NOTE_TEMPLATES as defaultTemplates } from '@/lib/templates';

const TEMPLATES_STORAGE_KEY = 'custom-note-templates';

type TemplatesContextType = {
  templates: NoteTemplate[];
  addTemplate: (template: Omit<NoteTemplate, 'id' | 'isCustom'>) => void;
  updateTemplate: (template: NoteTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  isLoading: boolean;
};

const TemplatesContext = React.createContext<TemplatesContextType | undefined>(undefined);

export function TemplatesProvider({ children }: { children: React.ReactNode }) {
  const [templates, setTemplates] = React.useState<NoteTemplate[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    try {
      const storedCustomTemplates = localStorage.getItem(TEMPLATES_STORAGE_KEY);
      const customTemplates = storedCustomTemplates ? JSON.parse(storedCustomTemplates) : [];
      setTemplates([...defaultTemplates, ...customTemplates]);
    } catch (error) {
      console.error("Failed to load templates from localStorage", error);
      setTemplates(defaultTemplates);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveCustomTemplates = (customTemplates: NoteTemplate[]) => {
    try {
      localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(customTemplates));
    } catch (error) {
      console.error("Failed to save templates to localStorage", error);
    }
  };

  const addTemplate = (templateData: Omit<NoteTemplate, 'id' | 'isCustom'>) => {
    const newTemplate: NoteTemplate = {
      ...templateData,
      id: new Date().toISOString() + Math.random(),
      isCustom: true,
    };
    setTemplates(prev => {
        const newTemplates = [...prev, newTemplate];
        saveCustomTemplates(newTemplates.filter(t => t.isCustom));
        return newTemplates;
    });
  };

  const updateTemplate = (updatedTemplate: NoteTemplate) => {
    setTemplates(prev => {
        const newTemplates = prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
        saveCustomTemplates(newTemplates.filter(t => t.isCustom));
        return newTemplates;
    });
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(prev => {
        const newTemplates = prev.filter(t => t.id !== templateId);
        saveCustomTemplates(newTemplates.filter(t => t.isCustom));
        return newTemplates;
    });
  };

  const value = { templates, addTemplate, updateTemplate, deleteTemplate, isLoading };

  return (
    <TemplatesContext.Provider value={value}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = React.useContext(TemplatesContext);
  if (context === undefined) {
    throw new Error('useTemplates must be used within a TemplatesProvider');
  }
  return context;
}
