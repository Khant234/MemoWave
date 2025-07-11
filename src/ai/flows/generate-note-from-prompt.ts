'use server';
/**
 * @fileOverview An AI agent that generates a complete note from a user's prompt.
 *
 * - generateNoteFromPrompt - A function that takes a prompt and generates a title and content.
 * - GenerateNoteFromPromptInput - The input type for the function.
 * - GenerateNoteFromPromptOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNoteFromPromptInputSchema = z.object({
  prompt: z.string().describe('The user-provided prompt to generate the note from.'),
});
export type GenerateNoteFromPromptInput = z.infer<typeof GenerateNoteFromPromptInputSchema>;

const GenerateNoteFromPromptOutputSchema = z.object({
  title: z
    .string()
    .describe('A concise and relevant title for the generated note.'),
  content: z
    .string()
    .describe(
      'The detailed, well-structured content of the note, formatted using Markdown.'
    ),
});
export type GenerateNoteFromPromptOutput = z.infer<typeof GenerateNoteFromPromptOutputSchema>;

export async function generateNoteFromPrompt(input: GenerateNoteFromPromptInput): Promise<GenerateNoteFromPromptOutput> {
  return generateNoteFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNoteFromPrompt',
  input: {schema: GenerateNoteFromPromptInputSchema},
  output: {schema: GenerateNoteFromPromptOutputSchema},
  prompt: `You are an expert content writer and researcher. A user has given you a prompt to write a note about.
Your task is to generate a comprehensive, well-structured note based on the prompt.

**User's Prompt:**
"{{{prompt}}}"

**Instructions:**
1.  **Generate a Title:** Create a clear and descriptive title for the note that accurately reflects the prompt.
2.  **Generate Content:** Write detailed content for the note. Use Markdown for formatting (e.g., headings, lists, bold text) to make the content organized and easy to read.

Return the result as a single JSON object with "title" and "content" fields.`,
});

const generateNoteFromPromptFlow = ai.defineFlow(
  {
    name: 'generateNoteFromPromptFlow',
    inputSchema: GenerateNoteFromPromptInputSchema,
    outputSchema: GenerateNoteFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
