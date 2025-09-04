'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing a user's financial health.
 *
 * - getFinancialHealth - A function that analyzes financial data and provides a score and feedback.
 * - GetFinancialHealthInput - The input type for the getFinancialHealth function.
 * - GetFinancialHealthOutput - The return type for the getFinancialHealth function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetFinancialHealthInputSchema = z.object({
  income: z.number().describe('The user\'s total monthly income.'),
  spending: z.number().describe('The user\'s total monthly spending.'),
  goalProgress: z.number().describe('The user\'s progress towards their financial goal, as a percentage (0-100).'),
});
export type GetFinancialHealthInput = z.infer<
  typeof GetFinancialHealthInputSchema
>;

const GetFinancialHealthOutputSchema = z.object({
    score: z.number().min(0).max(100).describe("A financial health score from 0 to 100, where 100 is excellent."),
    goodPoints: z.array(z.string()).describe("A list of positive financial habits or observations."),
    areasForImprovement: z.array(z.string()).describe("A list of actionable suggestions for improvement."),
});
export type GetFinancialHealthOutput = z.infer<
  typeof GetFinancialHealthOutputSchema
>;

export async function getFinancialHealth(
  input: GetFinancialHealthInput
): Promise<GetFinancialHealthOutput> {
  return getFinancialHealthFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getFinancialHealthPrompt',
  input: {schema: GetFinancialHealthInputSchema},
  output: {schema: GetFinancialHealthOutputSchema},
  prompt: `You are a financial advisor for college students. Analyze the following financial data and provide a financial health score and actionable feedback.

The user is a college student. Keep your feedback concise, encouraging, and relevant to a student's lifestyle.

Data:
- Monthly Income: \${{{income}}}
- Monthly Spending: \${{{spending}}}
- Savings Goal Progress: {{{goalProgress}}}%

Based on this, generate a financial health score. A score of 100 is perfect. Consider factors like savings rate (income vs. spending) and goal progress.

Also, provide a few bullet points on what they are doing well and a few areas where they could improve. Frame the improvement areas as positive, actionable steps.
`,
});

const getFinancialHealthFlow = ai.defineFlow(
  {
    name: 'getFinancialHealthFlow',
    inputSchema: GetFinancialHealthInputSchema,
    outputSchema: GetFinancialHealthOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
