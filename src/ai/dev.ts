'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/categorize-transaction.ts';
import '@/ai/flows/get-financial-health.ts';
import '@/ai/flows/answer-help-question.ts';
import '@/ai/flows/get-investment-advice.ts';
import '@/ai/flows/extract-transactions-from-document.ts';
import '@/ai/flows/get-smart-goal-allocations.ts';
