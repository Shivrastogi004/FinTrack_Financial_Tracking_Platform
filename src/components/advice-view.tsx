
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Sparkles, Loader2, DollarSign, Zap } from 'lucide-react';
import { getInvestmentAdvice } from '@/ai/flows/get-investment-advice';
import type { GetInvestmentAdviceOutput } from '@/ai/flows/get-investment-advice';
import { useToast } from '@/hooks/use-toast';

export default function AdviceView() {
  const { goal } = useAppContext();
  const [advice, setAdvice] = useState<GetInvestmentAdviceOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const savings = useMemo(() => {
    return goal.currentAmount;
  }, [goal]);

  const handleGetAdvice = async () => {
    setIsGenerating(true);
    setAdvice(null);
    try {
      const result = await getInvestmentAdvice({ savings: Math.max(0, savings) }); // Ensure savings is not negative
      setAdvice(result);
    } catch (error) {
      console.error("Failed to get investment advice:", error);
      toast({
        title: 'AI Advisor Error',
        description: 'Could not get advice at this time. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investment Advisor</h1>
        <p className="text-muted-foreground">Turn your savings into investments. Get AI-powered advice.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Why Invest?</CardTitle>
            <CardDescription>Small steps now can lead to big rewards later.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Grow Your Money</h3>
                <p className="text-sm text-muted-foreground">Investing can help your money grow faster than just saving it, thanks to compound interest.</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Beat Inflation</h3>
                <p className="text-sm text-muted-foreground">Your savings can lose value over time. Investing helps protect your purchasing power.</p>
              </div>
            </div>
             <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary p-2 rounded-full">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">Start Early</h3>
                <p className="text-sm text-muted-foreground">The earlier you start, the more time your money has to grow. Even small amounts can make a big difference.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>Your Current Savings Towards Your Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-5xl font-bold ${savings >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                ${savings.toFixed(2)}
              </p>
              <p className="text-sm text-muted-foreground">This is the amount you've saved in your '{goal.name}' goal.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleGetAdvice} className="w-full" disabled={isGenerating || savings < 1}>
                {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                {isGenerating ? 'Thinking...' : 'Get AI Investment Advice'}
              </Button>
            </CardFooter>
          </Card>
          
          {advice && (
            <Card>
                <CardHeader>
                    <CardTitle>Your Personalized Suggestions</CardTitle>
                    <CardDescription>Here's what our AI advisor thinks you could do next.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 p-4 bg-accent rounded-lg">{advice.advice}</p>
                    
                    <h3 className="font-semibold mb-2">Suggested Stocks to Research:</h3>
                    <div className="space-y-3">
                        {advice.suggestedStocks.map(stock => (
                            <div key={stock.ticker} className="p-3 border rounded-md">
                                <div className="flex justify-between items-center">
                                    <p className="font-bold">{stock.company} ({stock.ticker})</p>
                                    {stock.price && <p className="font-mono text-sm">${stock.price.toFixed(2)}</p>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{stock.reason}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
                 <CardFooter>
                    <p className="text-xs text-muted-foreground italic">Disclaimer: This is not financial advice. All investments carry risk. Please do your own research before investing.</p>
                </CardFooter>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
