export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  color: string;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  audioUrl?: string;
  checklist: { id: string; text: string; completed: boolean }[];
};
