'use server';

/**
 * @fileOverview Defines a Genkit flow for intelligently allocating savings across multiple financial goals.
 *
 * - getSmartGoalAllocations - A function that suggests percentage allocations for goals.
 * - GetSmartGoalAllocationsInput - The input type for the function.
 * - GetSmartGoalAllocationsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoalInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number(),
  currentAmount: z.number(),
});

const GetSmartGoalAllocationsInputSchema = z.object({
  goals: z.array(GoalInputSchema).describe("The user's list of financial goals."),
  totalMonthlySavings: z.number().describe("The user's total available monthly savings to be allocated."),
});
export type GetSmartGoalAllocationsInput = z.infer<
  typeof GetSmartGoalAllocationsInputSchema
>;

const AllocationSchema = z.object({
    goalId: z.string().describe("The ID of the goal."),
    percentage: z.number().describe("The suggested allocation percentage for this goal."),
});

const GetSmartGoalAllocationsOutputSchema = z.object({
  allocations: z.array(AllocationSchema).describe("An array of suggested goal allocations."),
});
export type GetSmartGoalAllocationsOutput = z.infer<
  typeof GetSmartGoalAllocationsOutputSchema
>;


export async function getSmartGoalAllocations(
  input: GetSmartGoalAllocationsInput
): Promise<GetSmartGoalAllocationsOutput> {
  return getSmartGoalAllocationsFlow(input);
}


const prompt = ai.definePrompt({
    name: 'getSmartGoalAllocationsPrompt',
    input: {schema: GetSmartGoalAllocationsInputSchema},
    output: {schema: GetSmartGoalAllocationsOutputSchema},
    prompt: `You are a financial advisor for college students. Your task is to create a smart savings allocation plan.

The user has a total of \${{{totalMonthlySavings}}} to save this month.

Here are their goals:
{{#each goals}}
- Goal: {{{name}}} (ID: {{{id}}})
  - Target: \${{{targetAmount}}}
  - Saved so far: \${{{currentAmount}}}
{{/each}}

Analyze the goals and suggest a percentage allocation for each one. The total allocation must sum up to exactly 100%.

Your strategy should be:
1.  Prioritize finishing smaller, more achievable goals first to build momentum (the "snowball method").
2.  However, ensure that larger, long-term goals still receive some funding, even if it's a smaller percentage.
3.  Consider the remaining amount needed for each goal. A goal that is almost complete might get a higher allocation to finish it off.

Return the result as an array of allocation objects, each with a 'goalId' and its suggested 'percentage'. Do not provide any explanation or preamble, only the structured data.`,
});

const getSmartGoalAllocationsFlow = ai.defineFlow(
  {
    name: 'getSmartGoalAllocationsFlow',
    inputSchema: GetSmartGoalAllocationsInputSchema,
    outputSchema: GetSmartGoalAllocationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
