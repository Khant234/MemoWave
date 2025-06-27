'use server';
/**
 * @fileOverview Converts Burmese text to speech for audio playback.
 *
 * - burmeseTextToVoice - A function that handles the text-to-speech conversion.
 * - BurmeseTextToVoiceInput - The input type for the burmeseTextToVoice function.
 * - BurmeseTextToVoiceOutput - The return type for the burmeseTextToVoice function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const BurmeseTextToVoiceInputSchema = z.string().describe('The Burmese text to convert to speech.');
export type BurmeseTextToVoiceInput = z.infer<typeof BurmeseTextToVoiceInputSchema>;

const BurmeseTextToVoiceOutputSchema = z.object({
  media: z.string().describe('The audio data as a data URI.'),
});
export type BurmeseTextToVoiceOutput = z.infer<typeof BurmeseTextToVoiceOutputSchema>;

export async function burmeseTextToVoice(input: BurmeseTextToVoiceInput): Promise<BurmeseTextToVoiceOutput> {
  return burmeseTextToVoiceFlow(input);
}

const burmeseTextToVoiceFlow = ai.defineFlow(
  {
    name: 'burmeseTextToVoiceFlow',
    inputSchema: BurmeseTextToVoiceInputSchema,
    outputSchema: BurmeseTextToVoiceOutputSchema,
  },
  async (query) => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-preview-tts'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          languageCode: 'my-MM',
        },
      },
      prompt: query,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    
    // Return the raw audio data URI to isolate the problem.
    return {
      media: media.url,
    };
  }
);
