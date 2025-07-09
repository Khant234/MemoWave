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
  prompt: `You are an intelligent writing assistant. Your task is to continue the text provided by the user in a natural and coherent way.
Provide only the next sentence or a short paragraph that logically follows the input text.
Do not repeat the original text in your response. The completion should start with a space if it's meant to be appended directly.

Text to continue:
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
