
'use client';

import React, { useMemo, useState } from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, startOfMonth } from 'date-fns';
import { CategoryIcon } from './category-icon';
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid, Line, LineChart } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Goal, Sparkles, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
import { getFinancialHealth } from '@/ai/flows/get-financial-health';
import type { GetFinancialHealthOutput } from '@/ai/flows/get-financial-health';


const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28'];

export default function DashboardView() {
  const { transactions, budgets, goal } = useAppContext();
  const [healthAnalysis, setHealthAnalysis] = useState<GetFinancialHealthOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const spendingByCategory = useMemo(() => {
    return transactions
      .filter(t => t.amount > 0)
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
  }, [transactions]);
  
  const totalSpending = useMemo(() => Object.values(spendingByCategory).reduce((sum, amount) => sum + amount, 0), [spendingByCategory]);
  const totalIncome = useMemo(() => transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0), [transactions]);
  const netFlow = useMemo(() => totalIncome - totalSpending, [totalIncome, totalSpending]);
  
  const spendingPieChartData = useMemo(() => {
    return Object.entries(spendingByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [spendingByCategory]);

  const spendingPieChartConfig = useMemo(() => {
    const config: ChartConfig = {};
    spendingPieChartData.forEach((entry, index) => {
        config[entry.name] = {
            label: entry.name,
            color: COLORS[index % COLORS.length],
        };
    });
    return config;
  }, [spendingPieChartData]);

  const monthlyFlowData = useMemo(() => {
    const dataByMonth: Record<string, { income: number, spending: number }> = {};
    
    transactions.forEach(t => {
      const month = format(startOfMonth(new Date(t.date)), 'MMM yyyy');
      if (!dataByMonth[month]) {
        dataByMonth[month] = { income: 0, spending: 0 };
      }
      if (t.amount < 0) {
        dataByMonth[month].income += Math.abs(t.amount);
      } else {
        dataByMonth[month].spending += t.amount;
      }
    });

    return Object.entries(dataByMonth).map(([month, { income, spending }]) => ({
      month,
      income,
      spending,
    })).reverse(); // Show most recent months first
  }, [transactions]);
  
  const monthlyFlowChartConfig: ChartConfig = {
      income: { label: "Income", color: "hsl(var(--chart-2))" },
      spending: { label: "Spending", color: "hsl(var(--chart-1))" },
  };

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setHealthAnalysis(null);
    try {
      const result = await getFinancialHealth({
        income: totalIncome,
        spending: totalSpending,
        goalProgress: (goal.currentAmount / goal.targetAmount) * 100,
      });
      setHealthAnalysis(result);
    } catch (error) {
      console.error("Financial health analysis failed:", error);
      // You could show a toast notification here
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
               <span className="text-muted-foreground">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spending</CardTitle>
               <span className="text-muted-foreground">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalSpending.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
              <span className={`text-sm ${netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>{netFlow >= 0 ? '▲' : '▼'}</span>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netFlow >= 0 ? 'text-green-500' : 'text-red-500'}`}>${netFlow.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">Compared to last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Financial Goal</CardTitle>
              <Goal className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
               <div className="text-2xl font-bold">{((goal.currentAmount/goal.targetAmount)*100).toFixed(0)}%</div>
               <p className="text-xs text-muted-foreground">{goal.name}</p>
            </CardContent>
          </Card>
      </div>

       <Card className="bg-primary/10 border-primary/20">
        <CardHeader>
            <div className='flex items-center justify-between'>
                <div>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        <Sparkles />
                        <span>AI Financial Health Check-up</span>
                    </CardTitle>
                    <CardDescription>Get personalized insights into your financial habits.</CardDescription>
                </div>
                <Button onClick={handleRunAnalysis} disabled={isAnalyzing}>
                    {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Analyze My Finances
                </Button>
            </div>
        </CardHeader>
        {isAnalyzing && (
            <CardContent className="text-center">
                <p className="text-muted-foreground animate-pulse">Analyzing your data...</p>
            </CardContent>
        )}
        {healthAnalysis && (
            <CardContent className="grid md:grid-cols-3 gap-6">
                <Card className="col-span-3 md:col-span-1 text-center flex flex-col justify-center items-center">
                    <CardHeader>
                        <CardTitle>Your Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-6xl font-bold text-primary">{healthAnalysis.score}</p>
                        <p className="text-sm text-muted-foreground">out of 100</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3 md:col-span-1">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-500"><CheckCircle /> What's Going Well</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm list-disc pl-5">
                            {healthAnalysis.goodPoints.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                 <Card className="col-span-3 md:col-span-1">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-500"><AlertTriangle /> Areas to Improve</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ul className="space-y-2 text-sm list-disc pl-5">
                            {healthAnalysis.areasForImprovement.map((point, i) => <li key={i}>{point}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </CardContent>
        )}
      </Card>


      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
            <CardHeader>
              <CardTitle>Income vs. Spending</CardTitle>
              <CardDescription>A look at your cash flow over the last few months.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ChartContainer config={monthlyFlowChartConfig} className="min-h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyFlowData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Bar dataKey="income" fill="var(--color-income)" radius={4} />
                          <Bar dataKey="spending" fill="var(--color-spending)" radius={4} />
                      </BarChart>
                  </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Yearly Spending Trend</CardTitle>
                <CardDescription>Your spending pattern over the current year.</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
                <ChartContainer config={{ spending: { label: 'Spending', color: 'hsl(var(--chart-1))' } }} className="min-h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={monthlyFlowData.slice(0,12).reverse()} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend />
                            <Line type="monotone" dataKey="spending" stroke="var(--color-spending)" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>A breakdown of your spending this month.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
             {spendingPieChartData.length > 0 ? (
                <ChartContainer config={spendingPieChartConfig} className="min-h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Pie data={spendingPieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                            {spendingPieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.name in spendingPieChartConfig ? spendingPieChartConfig[entry.name].color : COLORS[index % COLORS.length]} />
                            ))}
                            </Pie>
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
              </ChartContainer>
            ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                    No spending data available.
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {recentTransactions.length > 0 ? (
                  recentTransactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={t.category} className="h-5 w-5 text-muted-foreground" />
                          <div className="flex flex-col">
                              <span className="font-medium">{t.merchant}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(t.date), 'MMM d')}</span>
                          </div>
                        </div>
                      </TableCell>
                       <TableCell>
                          <Badge variant="outline">{t.category}</Badge>
                       </TableCell>
                      <TableCell className={`text-right font-medium ${t.amount < 0 ? 'text-green-500' : ''}`}>
                        {t.amount < 0 ? `+$${Math.abs(t.amount).toFixed(2)}` : `-$${t.amount.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">No transactions yet.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
             <CardFooter className="justify-center border-t p-4">
                <Button size="sm" variant="ghost" className="w-full">
                    View All <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    