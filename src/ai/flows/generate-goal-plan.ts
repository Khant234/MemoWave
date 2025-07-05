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
      "A realistic future due date for this task, formatted as an ISO 8601 string (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ'). Due dates should be sequential and logically spaced out over a realistic timeframe for the goal."
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

**CRITICAL CONTEXT: The current date is {{request.time}}.**

**YOUR MOST IMPORTANT RULE: All due dates you generate MUST be in the future, relative to this current date. Do NOT generate dates in the past. For example, if the current date is in July 2025, a due date in 2024 or June 2025 is incorrect and strictly forbidden.**

**User's Goal:**
"{{{goal}}}"

**Your Task:**
1.  **Analyze the Goal:** First, understand the complexity and implied timeline of the user's goal.
2.  **Decompose into Milestones:** Break the goal down into logical, sequential milestones. Each milestone will become a separate note in the plan.
3.  **Create Actionable Steps:** For each milestone (note), create a checklist of small, concrete sub-tasks that need to be completed.
4.  **Assign Realistic Future Deadlines:**
    *   **Start Date:** The very first task should be scheduled for tomorrow, relative to the current date.
    *   **Logical Sequencing:** The milestones you generate must be in a logical order. Ensure that the due dates reflect this sequence (e.g., Task 2's due date is after Task 1's).
    *   **Realistic Timeframe:** Analyze the user's goal to determine a realistic overall timeframe. A goal like "learn a new programming language" should take weeks or months, not days. A goal like "organize my closet" might only take a day or two.
    *   **Pacing:** Do not cluster all due dates together. Spread them out evenly over the determined timeframe to create a manageable pace and avoid burnout. For long-term goals, this might mean one milestone per week or every two weeks.
    *   **Date Format:** Return all due dates as a full ISO 8601 string (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ').
5.  **Generate Relevant Data:** For each note, provide a concise title, a brief content summary, and relevant tags.
6.  **Final Review:** Before you output the JSON, double-check every \`dueDate\` to ensure it is in the future relative to the current date of {{request.time}}.

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
