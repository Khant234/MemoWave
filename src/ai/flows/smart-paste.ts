'use server';
/**
 * @fileOverview An AI agent that intelligently parses pasted text into a structured note.
 *
 * - smartPaste - A function that processes raw text into a note structure.
 * - SmartPasteInput - The input type for the smartPaste function.
 * - SmartPasteOutput - The return type for the smartPaste function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartPasteInputSchema = z.object({
  pastedText: z.string().describe('The raw text pasted by the user.'),
});
export type SmartPasteInput = z.infer<typeof SmartPasteInputSchema>;

const ChecklistItemSchema = z.object({
  text: z.string().describe('The text of the checklist item.'),
});

const SmartPasteOutputSchema = z.object({
  title: z
    .string()
    .describe(
      'A concise, descriptive title generated from the text content. Should be no more than 10 words.'
    ),
  content: z
    .string()
    .describe(
      'The main body of the note, cleaned up and formatted with Markdown for readability.'
    ),
  checklist: z
    .array(ChecklistItemSchema)
    .optional()
    .describe('A list of actionable to-do items extracted from the text.'),
});
export type SmartPasteOutput = z.infer<typeof SmartPasteOutputSchema>;

export async function smartPaste(input: SmartPasteInput): Promise<SmartPasteOutput> {
  return smartPasteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartPastePrompt',
  input: {schema: SmartPasteInputSchema},
  output: {schema: SmartPasteOutputSchema},
  prompt: `You are an expert content organizer. A user has pasted a block of text. Your task is to analyze it and structure it into a clean, organized note.

Follow these steps:
1.  **Generate a Title:** Create a short, clear, and descriptive title for the note based on the overall content.
2.  **Format Content:** Clean up the original text and format it using Markdown for better readability. Ensure the main substance of the text is preserved.
3.  **Extract Checklist:** Identify any actionable tasks, to-do items, or clear action points within the text. If any are found, format them as a checklist. If no actionable items are found, return an empty or undefined array for the checklist.

Pasted Text:
"""
{{{pastedText}}}
"""

Return the result as a single JSON object.`,
});

const smartPasteFlow = ai.defineFlow(
  {
    name: 'smartPasteFlow',
    inputSchema: SmartPasteInputSchema,
    outputSchema: SmartPasteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
