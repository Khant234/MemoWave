'use server';
/**
 * @fileOverview An AI-powered template generator.
 *
 * - generateTemplate - A function that handles the template generation process.
 * - GenerateTemplateInput - The input type for the generateTemplate function.
 * - GenerateTemplateOutput - The return type for the generateTemplate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateTemplateInputSchema = z.object({
  prompt: z.string().describe('A description of the kind of template the user wants to generate.'),
});
export type GenerateTemplateInput = z.infer<typeof GenerateTemplateInputSchema>;

const ChecklistItemSchema = z.object({
  text: z.string().describe('The text of the checklist item.'),
});

const GenerateTemplateOutputSchema = z.object({
  name: z.string().describe('A concise and descriptive name for the template. e.g., "Weekly Review".'),
  description: z.string().describe('A short, one-sentence description of what the template is for.'),
  title: z.string().optional().describe('A suggested title for a note created from this template. Use placeholders like [Date] or [Project Name] where appropriate.'),
  content: z.string().describe('The main body of the template, formatted using Markdown. This should be the core content of the note.'),
  checklist: z.array(ChecklistItemSchema).optional().describe('An optional list of relevant checklist items for the template.'),
  category: z.enum(['personal', 'professional', 'business', 'uncategorized']).describe("The most relevant category for this template based on its purpose. Choose from 'personal', 'professional', 'business', or 'uncategorized'."),
});
export type GenerateTemplateOutput = z.infer<typeof GenerateTemplateOutputSchema>;

export async function generateTemplate(input: GenerateTemplateInput): Promise<GenerateTemplateOutput> {
  return generateTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTemplatePrompt',
  input: {schema: GenerateTemplateInputSchema},
  output: {schema: GenerateTemplateOutputSchema},
  prompt: `You are an expert at creating structured and useful note templates.
A user wants a template for the following purpose: "{{{prompt}}}"

Based on the user's request, generate a complete template object. The template should be practical and well-organized.

Follow these instructions:
1.  **Name:** Create a short, clear name for the template.
2.  **Description:** Write a brief, one-sentence description.
3.  **Title:** Suggest a title for a note made from this template. Use placeholders like '[Date]' where it makes sense.
4.  **Category:** Assign the most logical category: 'personal', 'professional', 'business', or 'uncategorized'.
5.  **Content:** Write the main body of the template using Markdown for structure (e.g., headings, lists).
6.  **Checklist:** If relevant, create a list of actionable checklist items. If not relevant, return an empty or undefined array.

Return the result as a single JSON object.
  `,
});

const generateTemplateFlow = ai.defineFlow(
  {
    name: 'generateTemplateFlow',
    inputSchema: GenerateTemplateInputSchema,
    outputSchema: GenerateTemplateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
