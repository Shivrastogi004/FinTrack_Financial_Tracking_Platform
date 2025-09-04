
'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing investment advice.
 *
 * - getInvestmentAdvice - A function that provides investment advice based on savings.
 * - GetInvestmentAdviceInput - The input type for the getInvestmentAdvice function.
 * - GetInvestmentAdviceOutput - The return type for the getInvestmentAdvice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetInvestmentAdviceInputSchema = z.object({
  savings: z.number().describe("The user's current savings amount."),
});
export type GetInvestmentAdviceInput = z.infer<
  typeof GetInvestmentAdviceInputSchema
>;

const GetInvestmentAdviceOutputSchema = z.object({
  advice: z.string().describe('Personalized investment advice for a college student.'),
  suggestedStocks: z.array(z.object({
      ticker: z.string().describe("The stock ticker symbol."),
      company: z.string().describe("The company name."),
      price: z.number().optional().describe("The current stock price."),
      reason: z.string().describe("The reason for suggesting this stock for a student.")
  })).describe("A list of 2-3 suggested stocks with reasons and current prices.")
});
export type GetInvestmentAdviceOutput = z.infer<
  typeof GetInvestmentAdviceOutputSchema
>;

export async function getInvestmentAdvice(
  input: GetInvestmentAdviceInput
): Promise<GetInvestmentAdviceOutput> {
  return getInvestmentAdviceFlow(input);
}

// Dummy function to simulate fetching a stock price
const getStockPriceTool = ai.defineTool(
    {
        name: 'getStockPrice',
        description: 'Get the current stock price for a given ticker symbol.',
        inputSchema: z.object({ ticker: z.string() }),
        outputSchema: z.number(),
    },
    async ({ ticker }) => {
        // In a real app, you would call a stock market API here.
        // For this example, we'll return a deterministic "random" price based on the ticker
        // to avoid hydration errors between server and client renders.
        console.log(`Fetching price for ${ticker}...`);
        const charCodeSum = ticker.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        const pseudoRandom = (charCodeSum * 31) % 200; // Simple hash to get a value between 0-199
        return pseudoRandom + 10; // Return a price between $10 and $209
    }
);


const prompt = ai.definePrompt({
  name: 'getInvestmentAdvicePrompt',
  input: {schema: GetInvestmentAdviceInputSchema},
  output: {schema: GetInvestmentAdviceOutputSchema},
  tools: [getStockPriceTool],
  prompt: `You are a financial advisor specializing in investment advice for college students with limited budgets.

Analyze the user's savings and provide encouraging, simple, and actionable advice on how they could start investing in the stock market.

The user has saved \${{{savings}}}.

Your advice should:
1.  Be encouraging and acknowledge their savings effort.
2.  Explain the concept of investing in simple terms.
3.  Suggest a small, manageable amount to start with.
4.  Suggest 2-3 specific, well-known stocks (e.g., from tech, consumer goods) that are relatable to a student. For each stock, use the getStockPrice tool to fetch its current price and include it in your response. Provide a brief, one-sentence reason why it might be a good choice for a beginner investor.
5.  Include a disclaimer that this is not financial advice and that they should do their own research.
`,
});

const getInvestmentAdviceFlow = ai.defineFlow(
  {
    name: 'getInvestmentAdviceFlow',
    inputSchema: GetInvestmentAdviceInputSchema,
    outputSchema: GetInvestmentAdviceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
