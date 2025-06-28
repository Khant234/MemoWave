'use server';
/**
 * @fileOverview Extracts actionable items from note content and converts them into a checklist.
 *
 * - extractChecklistItems - A function that handles the checklist extraction process.
 * - ExtractChecklistItemsInput - The input type for the extractChecklistItems function.
 * - ExtractChecklistItemsOutput - The return type for the extractChecklistItems function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractChecklistItemsInputSchema = z.object({
  noteContent: z.string().describe('The content of the note to extract checklist items from.'),
});
export type ExtractChecklistItemsInput = z.infer<typeof ExtractChecklistItemsInputSchema>;

const ChecklistItemSchema = z.object({
  text: z.string().describe('The text of the checklist item.'),
  completed: z.boolean().default(false).describe('Whether the item is completed.'),
});

const ExtractChecklistItemsOutputSchema = z.object({
  items: z.array(ChecklistItemSchema).describe('An array of extracted checklist items.'),
});
export type ExtractChecklistItemsOutput = z.infer<typeof ExtractChecklistItemsOutputSchema>;

export async function extractChecklistItems(input: ExtractChecklistItemsInput): Promise<ExtractChecklistItemsOutput> {
  return extractChecklistItemsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractChecklistItemsPrompt',
  input: {schema: ExtractChecklistItemsInputSchema},
  output: {schema: ExtractChecklistItemsOutputSchema},
  prompt: `You are an expert at identifying actionable tasks within a block of text.
  Analyze the following note content and extract any tasks, to-do items, or clear action points.
  Format these items as a checklist. For each item, set 'completed' to false.
  If no actionable items are found, return an empty array for 'items'.

  Note Content:
  {{{noteContent}}}
  `,
});

const extractChecklistItemsFlow = ai.defineFlow(
  {
    name: 'extractChecklistItemsFlow',
    inputSchema: ExtractChecklistItemsInputSchema,
    outputSchema: ExtractChecklistItemsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
