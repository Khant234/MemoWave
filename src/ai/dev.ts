'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/burmese-text-to-voice.ts';
import '@/ai/flows/burmese-voice-to-text.ts';
import '@/ai/flows/note-summarization.ts';
import '@/ai/flows/title-generation.ts';
import '@/ai/flows/extract-checklist-items.ts';
import '@/ai/flows/translate-note.ts';
import '@/ai/flows/generate-goal-plan.ts';
import '@/ai/flows/extract-text-from-image.ts';
import '@/ai/flows/generate-template.ts';
import '@/ai/flows/complete-text.ts';
