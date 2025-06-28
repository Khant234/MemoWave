
import { type Note } from "./types";

export const NOTE_COLORS = [
  "#FCA5A5", // red-400
  "#FCD34D", // amber-400
  "#6EE7B7", // emerald-300
  "#93C5FD", // blue-300
  "#C4B5FD", // violet-300
  "#F9A8D4", // pink-300
  "#A1A1AA", // zinc-400
];


export const DUMMY_NOTES: Note[] = [
  {
    id: "1",
    title: "Project Phoenix Kick-off",
    content: "Meeting notes from the initial kick-off for Project Phoenix. Key discussion points included project scope, timeline, and initial resource allocation. Q3 deadline is tight but achievable. Action items assigned to team leads.",
    tags: ["work", "project-phoenix", "meeting"],
    color: NOTE_COLORS[1],
    isPinned: true,
    isArchived: false,
    isTrashed: false,
    createdAt: "2024-05-20T10:00:00Z",
    updatedAt: "2024-05-20T11:30:00Z",
    checklist: [
      { id: 'c1-1', text: 'Finalize project charter', completed: true },
      { id: 'c1-2', text: 'Onboard new back-end dev', completed: false },
    ],
  },
  {
    id: "2",
    title: "Grocery List",
    content: "Need to buy groceries for the week. Focus on fresh vegetables and fruits. Don't forget to check for discounts on pasta and sauces.",
    tags: ["personal", "shopping"],
    color: NOTE_COLORS[2],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: "2024-05-22T18:00:00Z",
    updatedAt: "2024-05-22T18:00:00Z",
    checklist: [
        { id: 'c2-1', text: 'Milk', completed: false },
        { id: 'c2-2', text: 'Bread', completed: false },
        { id: 'c2-3', text: 'Chicken Breast', completed: false },
        { id: 'c2-4', text: 'Avocadoes', completed: true },
    ],
  },
  {
    id: "3",
    title: "Ideas for Summer Vacation",
    content: "Brainstorming destinations for the summer trip. Options: hiking in the mountains, beach getaway in Southeast Asia, or a city tour in Europe. Need to check flight prices and visa requirements.",
    tags: ["travel", "planning", "ideas"],
    color: NOTE_COLORS[3],
    isPinned: false,
    isArchived: false,
    isTrashed: false,
    createdAt: "2024-05-18T14:20:00Z",
    updatedAt: "2024-05-21T09:00:00Z",
    imageUrl: "https://placehold.co/600x400.png",
    checklist: [],
  },
  {
    id: "4",
    title: "Book Club - Dune Summary",
    content: "Summary of the first half of Dune for the book club meeting. Focus on Paul Atreides' journey and the political landscape of Arrakis. The spice must flow!",
    tags: ["reading", "book-club"],
    color: NOTE_COLORS[4],
    isPinned: false,
    isArchived: true,
    isTrashed: false,
    createdAt: "2024-04-10T11:00:00Z",
    updatedAt: "2024-04-10T11:00:00Z",
    checklist: [],
  },
];
