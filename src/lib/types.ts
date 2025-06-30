
export type NoteVersion = {
  title: string;
  content: string;
  updatedAt: string;
};

export type NoteStatus = 'todo' | 'inprogress' | 'done';
export type NotePriority = 'none' | 'low' | 'medium' | 'high';

export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
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
  dueDate?: string | null;
  showOnBoard?: boolean;
  order: number;
};
