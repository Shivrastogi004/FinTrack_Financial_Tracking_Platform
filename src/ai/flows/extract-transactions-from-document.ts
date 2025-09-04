'use server';

/**
 * @fileOverview This file defines a Genkit flow for extracting transactions from a document.
 *
 * - extractTransactionsFromDocument - A function that takes a document and extracts transaction data.
 * - ExtractTransactionsInput - The input type for the function.
 * - ExtractTransactionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
    date: z.string().describe("The date of the transaction in YYYY-MM-DD format."),
    merchant: z.string().describe("The name of the merchant or a description of the transaction."),
    amount: z.number().describe("The amount of the transaction. Income should be negative, expenses should be positive."),
    category: z.string().describe("The predicted category for the transaction. Must be one of: Food, Textbooks, Transportation, Entertainment, Utilities, Rent, Salary, Savings Goal, Other."),
});

const ExtractTransactionsInputSchema = z.object({
  documentDataUri: z
    .string()
    .describe(
      "The document to extract transactions from, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractTransactionsInput = z.infer<typeof ExtractTransactionsInputSchema>;


const ExtractTransactionsOutputSchema = z.object({
  transactions: z.array(TransactionSchema).describe("An array of transactions extracted from the document."),
});
export type ExtractTransactionsOutput = z.infer<typeof ExtractTransactionsOutputSchema>;


export async function extractTransactionsFromDocument(
  input: ExtractTransactionsInput
): Promise<ExtractTransactionsOutput> {
  return extractTransactionsFlow(input);
}


const prompt = ai.definePrompt({
    name: 'extractTransactionsPrompt',
    input: {schema: ExtractTransactionsInputSchema},
    output: {schema: ExtractTransactionsOutputSchema},
    prompt: `You are an expert at parsing financial documents like bank statements, credit card statements, and digital wallet reports (like Google Pay or Paytm), which can be in CSV, PDF, or even image format.

Your task is to meticulously analyze the provided document and extract all individual transactions.

For each transaction, you must determine:
1.  **Date**: The exact date of the transaction. Format it as YYYY-MM-DD.
2.  **Merchant/Description**: The name of the merchant or a concise description.
3.  **Amount**: The transaction amount. Represent expenses as POSITIVE numbers and income as NEGATIVE numbers.
4.  **Category**: Classify the transaction into one of the following categories: Food, Textbooks, Transportation, Entertainment, Utilities, Rent, Salary, Savings Goal, Other.

Return the data as a structured array of transaction objects.

Document for analysis:
{{media url=documentDataUri}}
`,
});

const extractTransactionsFlow = ai.defineFlow(
  {
    name: 'extractTransactionsFlow',
    inputSchema: ExtractTransactionsInputSchema,
    outputSchema: ExtractTransactionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
