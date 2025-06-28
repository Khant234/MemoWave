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
import wav from 'wav';

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
    
    const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
    );

    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);


async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const writer = new wav.Writer({
        channels,
        sampleRate: rate,
        bitDepth: sampleWidth * 8,
      });
  
      const bufs: Buffer[] = [];
      writer.on('error', reject);
      writer.on('data', function (d) {
        bufs.push(d);
      });
      writer.on('end', function () {
        resolve(Buffer.concat(bufs).toString('base64'));
      });
  
      writer.write(pcmData);
      writer.end();
    });
  }
