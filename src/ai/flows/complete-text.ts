'use server';
/**
 * @fileOverview An AI-powered text completion agent.
 *
 * - completeText - A function that suggests a completion for a given text.
 * - CompleteTextInput - The input type for the completeText function.
 * - CompleteTextOutput - The return type for the completeText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompleteTextInputSchema = z.object({
  currentText: z.string().describe('The current text to be completed.'),
  language: z.string().optional().describe('The language for the completion (e.g., "English", "Burmese").'),
});
export type CompleteTextInput = z.infer<typeof CompleteTextInputSchema>;

const CompleteTextOutputSchema = z.object({
  completion: z.string().describe('The suggested completion for the text.'),
});
export type CompleteTextOutput = z.infer<typeof CompleteTextOutputSchema>;

export async function completeText(input: CompleteTextInput): Promise<CompleteTextOutput> {
  return completeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'completeTextPrompt',
  input: {schema: CompleteTextInputSchema},
  output: {schema: CompleteTextOutputSchema},
  prompt: `You are an intelligent writing assistant. Your task is to act like a text completion feature and continue the text provided by the user.

{{#if language}}
**IMPORTANT: The completion must be in {{language}}.**
When the language is specified, your primary goal is to **continue the sentence or paragraph**. Do **NOT** define, translate, or explain the input text. Just continue writing from where the user left off.
{{/if}}

Provide only the next few words, a sentence, or a short paragraph that logically follows the input text.
Your response should be a direct continuation of the user's text.
Do not repeat the original text in your response.
The completion should start with a space if it is intended to be appended directly to the existing text.

User's text to continue:
"{{{currentText}}}"`,
});

const completeTextFlow = ai.defineFlow(
  {
    name: 'completeTextFlow',
    inputSchema: CompleteTextInputSchema,
    outputSchema: CompleteTextOutputSchema,
  },
  async input => {
    // Return early if the text is empty
    if (!input.currentText.trim()) {
        return { completion: '' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
