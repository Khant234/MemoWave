import { config } from 'dotenv';
config();

import '@/ai/flows/burmese-text-to-voice.ts';
import '@/ai/flows/burmese-voice-to-text.ts';
import '@/ai/flows/note-summarization.ts';
import '@/ai/flows/suggest-tags.ts';
import '@/ai/flows/title-generation.ts';
import '@/ai/flows/extract-checklist-items.ts';
