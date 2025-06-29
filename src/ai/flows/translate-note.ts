'use server';
/**
 * @fileOverview Translates note content into a specified language.
 *
 * - translateNote - A function that handles the note translation process.
 * - TranslateNoteInput - The input type for the translateNote function.
 * - TranslateNoteOutput - The return type for the translateNote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TranslateNoteInputSchema = z.object({
  noteContent: z.string().describe('The text content of the note to translate.'),
  targetLanguage: z
    .string()
    .describe(
      'The target language to translate the content into (e.g., "Spanish", "Japanese", "French").'
    ),
});
export type TranslateNoteInput = z.infer<typeof TranslateNoteInputSchema>;

const TranslateNoteOutputSchema = z.object({
  translatedContent: z.string().describe('The translated note content.'),
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
  prompt: `Translate the following note content into {{targetLanguage}}.
  Return only the translated text in the 'translatedContent' field. Do not include any introductory text, titles, or markdown formatting. Just the raw translated text.

  Note Content:
  {{{noteContent}}}
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
