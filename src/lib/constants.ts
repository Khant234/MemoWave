
import { type NotePriority, type NoteStatus } from './types';

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
