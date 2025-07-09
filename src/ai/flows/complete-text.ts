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
  prompt: `You are an AI writing assistant. Your primary function is to continue the text provided by the user.
Act as a text completion feature.
Your response must be a direct continuation of the user's text, as if you are completing their sentence or starting the next one.

**ABSOLUTELY DO NOT:**
- Define the user's text.
- Explain the user's text.
- Translate the user's text.
- Repeat the user's text.

{{#if language}}
The completion must be in **{{language}}**.
{{/if}}

Your response should only contain the new text to be appended.
If it should be appended to the user's text, it must start with a space.

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
