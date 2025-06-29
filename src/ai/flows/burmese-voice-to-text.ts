'use server';
/**
 * @fileOverview Converts speech in English or Burmese to text.
 * 
 * - voiceToText - A function that converts speech to text.
 * - VoiceToTextInput - The input type for the voiceToText function.
 * - VoiceToTextOutput - The return type for the voiceToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VoiceToTextInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data URI of the speech recording. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type VoiceToTextInput = z.infer<typeof VoiceToTextInputSchema>;

const VoiceToTextOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the speech audio.'),
});
export type VoiceToTextOutput = z.infer<typeof VoiceToTextOutputSchema>;

export async function voiceToText(input: VoiceToTextInput): Promise<VoiceToTextOutput> {
  return voiceToTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'voiceToTextPrompt',
  input: {schema: VoiceToTextInputSchema},
  output: {schema: VoiceToTextOutputSchema},
  prompt: `Transcribe the following audio recording into text. The audio may be in English or Burmese. The output should be only the transcribed text.\n\nAudio: {{media url=audioDataUri}}`,
});

const voiceToTextFlow = ai.defineFlow(
  {
    name: 'voiceToTextFlow',
    inputSchema: VoiceToTextInputSchema,
    outputSchema: VoiceToTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
