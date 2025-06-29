'use server';
/**
 * @fileOverview Translates note content and checklist items into a specified language.
 *
 * - translateNote - A function that handles the note translation process.
 * - TranslateNoteInput - The input type for the translateNote function.
 * - TranslateNoteOutput - The return type for the translateNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChecklistItemInputSchema = z.object({
  id: z.string().describe("The unique identifier for the checklist item."),
  text: z.string().describe("The text of the checklist item to be translated."),
});

const TranslateNoteInputSchema = z.object({
  noteContent: z.string().describe('The text content of the note to translate.'),
  checklistItems: z.array(ChecklistItemInputSchema).describe('An array of checklist items to translate.'),
  targetLanguage: z
    .string()
    .describe(
      'The target language to translate the content into (e.g., "Burmese").'
    ),
});
export type TranslateNoteInput = z.infer<typeof TranslateNoteInputSchema>;

const TranslatedChecklistItemSchema = z.object({
  id: z.string().describe("The original ID of the checklist item."),
  translatedText: z.string().describe("The translated text for the checklist item."),
});

const TranslateNoteOutputSchema = z.object({
  translatedContent: z.string().describe('The translated note content.'),
  translatedChecklistItems: z.array(TranslatedChecklistItemSchema).describe('An array of translated checklist items.'),
});
export type TranslateNoteOutput = z.infer<typeof TranslateNoteOutputSchema>;

export async function translateNote(
  input: TranslateNoteInput
): Promise<TranslateNoteOutput> {
  return translateNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'translateNotePrompt',
  input: {schema: TranslateNoteInputSchema},
  output: {schema: TranslateNoteOutputSchema},
  prompt: `Translate the following note content and checklist items into {{targetLanguage}}.
Return only the translated text. For the content, put it in the 'translatedContent' field.
For the checklist, for each item you are given, return an object with the original 'id' and the 'translatedText' for the translated text.
If the note content is empty, return an empty string for 'translatedContent'.
If the checklist is empty, return an empty array for 'translatedChecklistItems'.

Note Content to Translate:
{{{noteContent}}}

{{#if checklistItems}}
Checklist Items to Translate:
{{#each checklistItems}}
- (ID: {{id}}) {{text}}
{{/each}}
{{/if}}
`,
});

const translateNoteFlow = ai.defineFlow(
  {
    name: 'translateNoteFlow',
    inputSchema: TranslateNoteInputSchema,
    outputSchema: TranslateNoteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
