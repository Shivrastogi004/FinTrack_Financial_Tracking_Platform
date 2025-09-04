'use server';

/**
 * @fileOverview This file defines a Genkit flow for answering user help questions.
 *
 * - answerHelpQuestion - A function that takes a user's question and provides a helpful answer.
 * - AnswerHelpQuestionInput - The input type for the answerHelpQuestion function.
 * - AnswerHelpQuestionOutput - The return type for the answerHelpQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnswerHelpQuestionInputSchema = z.object({
  question: z.string().describe("The user's question about the FinTrack application."),
});
export type AnswerHelpQuestionInput = z.infer<
  typeof AnswerHelpQuestionInputSchema
>;

const AnswerHelpQuestionOutputSchema = z.object({
  answer: z.string().describe('A helpful and concise answer to the user\'s question.'),
});
export type AnswerHelpQuestionOutput = z.infer<
  typeof AnswerHelpQuestionOutputSchema
>;

export async function answerHelpQuestion(
  input: AnswerHelpQuestionInput
): Promise<AnswerHelpQuestionOutput> {
  return answerHelpQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerHelpQuestionPrompt',
  input: {schema: AnswerHelpQuestionInputSchema},
  output: {schema: AnswerHelpQuestionOutputSchema},
  prompt: `You are a friendly and helpful support agent for an application called FinTrack, a personal finance app for college students.

Your task is to answer the user's question clearly and concisely.

User's Question: {{{question}}}

Please provide a helpful answer.`,
});

const answerHelpQuestionFlow = ai.defineFlow(
  {
    name: 'answerHelpQuestionFlow',
    inputSchema: AnswerHelpQuestionInputSchema,
    outputSchema: AnswerHelpQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
