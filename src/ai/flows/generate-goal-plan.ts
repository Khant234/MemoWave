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
import {add, differenceInMilliseconds, isBefore, parseISO} from 'date-fns';

const GenerateGoalPlanInputSchema = z.object({
  goal: z.string().describe("The user's goal to be planned."),
  targetLanguage: z.string().optional().describe("The language to generate the plan in (e.g., 'English', 'Burmese'). Defaults to English if not provided."),
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

{{#if targetLanguage}}
**IMPORTANT: Generate the entire plan—including titles, content, checklist items, and tags—in the following language: {{targetLanguage}}.**
{{else}}
**IMPORTANT: Generate the entire plan—including titles, content, checklist items, and tags—in English.**
{{/if}}

**User's Goal:**
"{{{goal}}}"

**Your Task:**
1.  **Analyze the Goal:** First, understand the complexity and implied timeline of the user's goal. A goal like "learn a new programming language" should take weeks or months, not days. A goal like "organize my closet" might only take a day or two.
2.  **Decompose into Milestones:** Break the goal down into logical, sequential milestones. Each milestone will become a separate note in the plan.
3.  **Create Actionable Steps:** For each milestone (note), create a checklist of small, concrete sub-tasks that need to be completed.
4.  **Assign Due Dates:**
    *   **Logical Sequencing:** The milestones you generate must be in a logical order. Ensure that the due dates reflect this sequence (e.g., Task 2's due date is after Task 1's).
    *   **Pacing:** Do not cluster all due dates together. Spread them out evenly over the determined timeframe to create a manageable pace and avoid burnout. For long-term goals, this might mean one milestone per week or every two weeks.
    *   **Date Format:** Return all due dates as a full ISO 8601 string (e.g., 'YYYY-MM-DDTHH:mm:ss.sssZ').
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
    
    if (!output || output.notes.length === 0) {
      return output!;
    }
    
    const now = new Date();
    const firstNoteDate = parseISO(output.notes[0].dueDate);

    // If the model generated dates in the past, remap them to the future
    // while preserving the relative intervals between tasks.
    if (isBefore(firstNoteDate, now)) {
        const modelDates = output.notes.map(note => parseISO(note.dueDate));
        let currentDate = add(now, { days: 1 }); // Start the plan tomorrow.

        for (let i = 0; i < output.notes.length; i++) {
            if (i === 0) {
                output.notes[i].dueDate = currentDate.toISOString();
            } else {
                const interval = differenceInMilliseconds(modelDates[i], modelDates[i - 1]);
                // Ensure interval is at least one day to prevent tasks from clustering on the same day.
                const safeInterval = Math.max(interval, 24 * 60 * 60 * 1000); 
                currentDate = add(currentDate, { milliseconds: safeInterval });
                output.notes[i].dueDate = currentDate.toISOString();
            }
        }
    }
    
    return output!;
  }
);
