'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { answerHelpQuestion } from '@/ai/flows/answer-help-question';
import { useToast } from '@/hooks/use-toast';

const faqItems = [
  {
    question: 'How do I add a new transaction?',
    answer: 'Navigate to the "Transactions" tab and click the "Add Transaction" button. Fill in the details and save. Use a negative amount for income (e.g., -100 for a $100 salary).',
  },
  {
    question: 'What is the AI Financial Health Check-up?',
    answer: 'The AI Check-up on your dashboard analyzes your income, spending, and goal progress to give you a financial score from 0-100. It also provides personalized tips on what you\'re doing well and where you can improve.',
  },
  {
    question: 'How do budgets work?',
    answer: 'In the "Budgets" tab, you can set monthly spending limits for different categories. The progress bars will show you how much you\'ve spent against your target, helping you stay on track.',
  },
  {
    question: 'Can I import transactions from a file?',
    answer: 'Yes! On the "Transactions" page, click the "Import CSV" button. Your file should have columns for date, merchant, amount, and optionally, category.',
  },
];

export default function HelpView() {
  const [question, setQuestion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiAnswer, setAiAnswer] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!question.trim()) {
      toast({ title: 'Please enter a question.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    setAiAnswer('');
    try {
      const result = await answerHelpQuestion({ question });
      setAiAnswer(result.answer);
    } catch (error) {
      console.error('Failed to get answer:', error);
      toast({ title: 'AI Assistant Error', description: 'Could not get an answer at this time. Please try again later.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-muted-foreground">Find answers to your questions and get help from our AI assistant.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" />
                <span>AI-Powered Assistant</span>
              </CardTitle>
              <CardDescription>Can't find an answer? Ask our AI assistant.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full gap-1.5">
                  <Label htmlFor="question">Your Question</Label>
                  <Textarea
                    id="question"
                    placeholder="e.g., How can I improve my financial score?"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Ask Assistant
                </Button>
              </form>
            </CardContent>
          </Card>

          {(isSubmitting || aiAnswer) && (
            <Card>
              <CardHeader>
                <CardTitle>AI Response</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitting ? (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <p className="text-sm">{aiAnswer}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
