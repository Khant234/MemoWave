import { type NoteTemplate } from './types';

export const NOTE_TEMPLATES: NoteTemplate[] = [
  {
    id: 'default-meeting',
    isCustom: false,
    name: 'Meeting Notes',
    description: 'Structure your meeting minutes effectively.',
    title: 'Meeting Notes - [Date]',
    content: `## Attendees:\n\n* \n\n## Agenda:\n\n1. \n\n## Discussion:\n\n* \n\n## Action Items:\n\n`,
    category: 'professional',
  },
  {
    id: 'default-project-plan',
    isCustom: false,
    name: 'Project Plan',
    description: 'Outline the key components of a new project.',
    title: 'Project Plan: [Project Name]',
    content: `## 1. Goal & Objectives:\n\n* \n\n## 2. Scope:\n\n* \n\n## 3. Key Stakeholders:\n\n* \n\n## 4. Timeline & Milestones:\n\n`,
    checklist: [
      { text: 'Define project scope and deliverables' },
      { text: 'Identify stakeholders and roles' },
      { text: 'Create timeline and set milestones' },
      { text: 'Allocate resources' },
    ],
    category: 'business',
  },
  {
    id: 'default-standup',
    isCustom: false,
    name: 'Daily Stand-up',
    description: 'A quick template for daily agile stand-ups.',
    title: 'Daily Stand-up - [Date]',
    content: `### What did I accomplish yesterday?\n\n* \n\n### What will I do today?\n\n* \n\n### What obstacles are impeding my progress?\n\n* \n\n`,
    category: 'professional',
  },
    {
    id: 'default-todo',
    isCustom: false,
    name: 'To-Do List',
    description: 'A simple to-do list to get things done.',
    title: 'My To-Do List',
    content: `Here are the things I need to get done:`,
    checklist: [
      { text: 'First task' },
      { text: 'Second task' },
      { text: 'Third task' },
    ],
    category: 'personal',
  },
];
