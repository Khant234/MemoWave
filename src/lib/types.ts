


export type NoteVersion = {
  title: string;
  content: string;
  updatedAt: string;
};

export type NoteStatus = 'todo' | 'inprogress' | 'done';
export type NotePriority = 'none' | 'low' | 'medium' | 'high';
export type NoteCategory = 'personal' | 'professional' | 'business' | 'uncategorized';

export type Note = {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  isTrashed: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  audioUrl?: string;
  checklist: { id: string; text: string; completed: boolean }[];
  isDraft?: boolean;
  history: NoteVersion[];

  // Project management fields
  status: NoteStatus;
  priority: NotePriority;
  category: NoteCategory;
  dueDate?: string | null;
  startTime?: string | null; // e.g., "14:30"
  endTime?: string | null;   // e.g., "15:30"
  showOnBoard?: boolean;
  order: number;

  // AI Goal Plan fields
  planId?: string;
  planGoal?: string;
};

export type NoteTemplate = {
  id: string;
  name: string;
  description: string;
  title?: string;
  content: string;
  checklist?: { text: string }[];
  category?: NoteCategory;
  isCustom?: boolean;
};
