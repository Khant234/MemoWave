
import { type NotePriority, type NoteStatus, type NoteCategory } from './types';

export const KANBAN_COLUMNS: NoteStatus[] = ['todo', 'inprogress', 'done'];

export const KANBAN_COLUMN_TITLES: Record<NoteStatus, string> = {
  todo: 'To Do',
  inprogress: 'In Progress',
  done: 'Done',
};

export const NOTE_PRIORITIES: NotePriority[] = ['none', 'low', 'medium', 'high'];

export const NOTE_PRIORITY_TITLES: Record<NotePriority, string> = {
    none: 'None',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
};

export const NOTE_CATEGORIES: NoteCategory[] = ['uncategorized', 'personal', 'professional', 'business'];

export const NOTE_CATEGORY_TITLES: Record<NoteCategory, string> = {
    uncategorized: 'Uncategorized',
    personal: 'Personal',
    professional: 'Professional',
    business: 'Business',
};
