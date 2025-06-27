'use server';
/**
 * @fileOverview Converts Burmese speech to text.
 * 
 * - burmeseVoiceToText - A function that converts Burmese speech to text.
 * - BurmeseVoiceToTextInput - The input type for the burmeseVoiceToText function.
 * - BurmeseVoiceToTextOutput - The return type for the burmeseVoiceToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BurmeseVoiceToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data URI of the Burmese speech recording.  It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BurmeseVoiceToTextInput = z.infer<typeof BurmeseVoiceToTextInputSchema>;

const BurmeseVoiceToTextOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the Burmese speech audio.'),
});
export type BurmeseVoiceToTextOutput = z.infer<typeof BurmeseVoiceToTextOutputSchema>;

export async function burmeseVoiceToText(input: BurmeseVoiceToTextInput): Promise<BurmeseVoiceToTextOutput> {
  return burmeseVoiceToTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'burmeseVoiceToTextPrompt',
  input: {schema: BurmeseVoiceToTextInputSchema},
  output: {schema: BurmeseVoiceToTextOutputSchema},
  prompt: `You are a transcription expert specializing in the Burmese language. Transcribe the following Burmese audio recording into Burmese text.\n\nAudio: {{media url=audioDataUri}}`,
});

const burmeseVoiceToTextFlow = ai.defineFlow(
  {
    name: 'burmeseVoiceToTextFlow',
    inputSchema: BurmeseVoiceToTextInputSchema,
    outputSchema: BurmeseVoiceToTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
