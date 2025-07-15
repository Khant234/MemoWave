'use server';
/**
 * @fileOverview An AI-powered grammar and spelling checker.
 *
 * - checkGrammarAndSpelling - A function that corrects grammar and spelling in a given text.
 * - CheckGrammarAndSpellingInput - The input type for the checkGrammarAndSpelling function.
 * - CheckGrammarAndSpellingOutput - The return type for the checkGrammarAndSpelling function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CheckGrammarAndSpellingInputSchema = z.object({
  text: z.string().describe('The text to be checked.'),
  language: z.string().optional().describe('The language of the text (e.g., "English", "Burmese"). Defaults to English.'),
});
export type CheckGrammarAndSpellingInput = z.infer<typeof CheckGrammarAndSpellingInputSchema>;

const CheckGrammarAndSpellingOutputSchema = z.object({
  correctedText: z.string().describe('The text with corrected grammar and spelling.'),
});
export type CheckGrammarAndSpellingOutput = z.infer<typeof CheckGrammarAndSpellingOutputSchema>;

export async function checkGrammarAndSpelling(input: CheckGrammarAndSpellingInput): Promise<CheckGrammarAndSpellingOutput> {
  return checkGrammarAndSpellingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkGrammarAndSpellingPrompt',
  input: {schema: CheckGrammarAndSpellingInputSchema},
  output: {schema: CheckGrammarAndSpellingOutputSchema},
  prompt: `You are an expert editor. Your task is to correct any grammar and spelling mistakes in the following text.
Do not change the meaning of the text.
If there are no errors, return the original text.

**IMPORTANT: Do not change any markdown formatting syntax. Preserve symbols like *, **, _, \` and # exactly as they are.**

**Language: {{#if language}}{{language}}{{else}}English{{/if}}**

Text to check:
"{{{text}}}"

Return only the corrected text in the 'correctedText' field.
`,
});

const checkGrammarAndSpellingFlow = ai.defineFlow(
  {
    name: 'checkGrammarAndSpellingFlow',
    inputSchema: CheckGrammarAndSpellingInputSchema,
    outputSchema: CheckGrammarAndSpellingOutputSchema,
    retry: {
      maxAttempts: 3,
      backoff: {
        delay: 500, // 500ms delay
        multiplier: 2, // Double the delay for each retry
      },
    }
  },
  async input => {
    if (!input.text.trim()) {
        return { correctedText: '' };
    }
    const {output} = await prompt(input);
    return output!;
  }
);
