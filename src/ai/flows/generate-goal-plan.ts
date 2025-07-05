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
  prompt: `You are an AI-powered project management assistant with expertise in goal decomposition and strategic planning. Your primary function is to transform a user's high-level goal into a detailed, actionable, and realistic project plan.

**User's Goal:**
"{{{goal}}}"

**Your Task:**
1.  **Analyze the Goal:** First, understand the complexity and implied timeline of the user's goal.
2.  **Decompose into Milestones:** Break the goal down into logical, sequential milestones. Each milestone will become a separate note in the plan.
3.  **Create Actionable Steps:** For each milestone (note), create a checklist of small, concrete sub-tasks that need to be completed.
4.  **Assign Realistic Deadlines:** The current date is {{request.time}}. Starting from tomorrow, intelligently schedule due dates for each milestone. Distribute the tasks logically over a timeframe appropriate for the goal. Avoid clustering all tasks at the beginning. For a multi-month goal, ensure tasks are spread across the entire period.
5.  **Generate Relevant Data:** For each note, provide a concise title, a brief content summary, and relevant tags.

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
