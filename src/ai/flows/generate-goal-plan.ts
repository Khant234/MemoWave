'use server';
/**
 * @fileOverview An AI-powered goal planner that breaks down a user's goal into actionable notes with checklists and due dates.
 *
 * - generateGoalPlan - A function that handles the goal planning process.
 * - GenerateGoalPlanInput - The input type for the generateGoalPlan function.
 * - GenerateGoalPlanOutput - The return type for the generateGoalPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGoalPlanInputSchema = z.object({
  goal: z.string().describe("The user's goal to be planned."),
});
export type GenerateGoalPlanInput = z.infer<typeof GenerateGoalPlanInputSchema>;

const ChecklistItemSchema = z.object({
  text: z.string().describe('The text of the checklist item.'),
});

const PlannedNoteSchema = z.object({
  title: z
    .string()
    .describe('A concise and descriptive title for this task or milestone.'),
  content: z
    .string()
    .describe('A brief summary of this part of the plan.'),
  tags: z
    .array(z.string())
    .describe('An array of relevant tags for this note.'),
  checklist: z
    .array(ChecklistItemSchema)
    .describe(
      'A detailed list of sub-tasks for this note.'
    ),
  dueDate: z
    .string()
    .describe(
      "A realistic due date for this task, formatted as an ISO 8601 string (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ'). Schedule tasks starting from tomorrow and spread them out over a reasonable timeframe."
    ),
});

const GenerateGoalPlanOutputSchema = z.object({
  notes: z
    .array(PlannedNoteSchema)
    .describe(
      "An array of planned notes that break down the user's goal."
    ),
});
export type GenerateGoalPlanOutput = z.infer<
  typeof GenerateGoalPlanOutputSchema
>;

export async function generateGoalPlan(
  input: GenerateGoalPlanInput
): Promise<GenerateGoalPlanOutput> {
  return generateGoalPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGoalPlanPrompt',
  input: {schema: GenerateGoalPlanInputSchema},
  output: {schema: GenerateGoalPlanOutputSchema},
  prompt: `You are an expert life coach and project planner. Your task is to take a user's goal and break it down into a series of actionable notes.

      Goal: "{{{goal}}}"

      Based on this goal, create a comprehensive plan consisting of several notes. Each note should represent a major task or milestone.

      For each note in the plan, you must provide:
      1.  **title**: A clear, concise title for the task.
      2.  **content**: A brief description of what the task involves.
      3.  **tags**: A few relevant, single-word or two-word tags.
      4.  **checklist**: A list of smaller, actionable sub-tasks (as an array of objects with a 'text' field).
      5.  **dueDate**: A realistic due date for completing the task. The current date is {{request.time}}. Schedule the tasks appropriately, starting from tomorrow and spreading them out logically over the next few weeks or months, depending on the goal's complexity. The due date must be a full ISO 8601 string.

      Return the entire plan as a JSON object with a "notes" array.
      `,
});

const generateGoalPlanFlow = ai.defineFlow(
  {
    name: 'generateGoalPlanFlow',
    inputSchema: GenerateGoalPlanInputSchema,
    outputSchema: GenerateGoalPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
