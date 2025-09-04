
'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Edit } from 'lucide-react';
import { CategoryIcon } from './category-icon';

const goalSchema = z.object({
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  targetAmount: z.coerce.number().positive('Target amount must be a positive number'),
  currentAmount: z.coerce.number().min(0, 'Current amount cannot be negative').optional(), // Make optional
});

export default function GoalsView() {
  const { goal, setGoal } = useAppContext();
  const [open, setOpen] = useState(false);
  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-3xl font-bold tracking-tight">Financial Goal</h1>
         <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Edit className="mr-2 h-4 w-4" /> Edit Goal
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Financial Goal</DialogTitle>
                </DialogHeader>
                <GoalForm 
                    goal={goal} 
                    onSave={(newGoal) => {
                        setGoal(newGoal);
                        setOpen(false);
                    }}
                    onCancel={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
      </div>

      <Card className="text-center">
        <CardHeader>
            <div className="mx-auto bg-accent rounded-full h-16 w-16 flex items-center justify-center">
                <CategoryIcon category="Savings Goal" className="h-8 w-8 text-primary" />
            </div>
          <CardTitle className="text-2xl mt-4">{goal.name}</CardTitle>
          <CardDescription className="text-4xl font-bold text-foreground">
            ${goal.currentAmount.toFixed(2)} / <span className="text-2xl font-semibold text-muted-foreground">${goal.targetAmount.toFixed(2)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-4" />
          <p className="text-muted-foreground mt-2">{progress.toFixed(1)}% of the way there!</p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoalForm({ goal, onSave, onCancel }: { goal: Goal; onSave: (data: Goal) => void; onCancel: () => void }) {
  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
        name: goal.name,
        targetAmount: goal.targetAmount,
    },
  });

  const onSubmit = (data: z.infer<typeof goalSchema>) => {
    onSave({
      ...goal, // preserve id and currentAmount
      name: data.name,
      targetAmount: data.targetAmount,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Save for a new laptop" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount</FormLabel>
              <FormControl>
                <Input type="number" placeholder="500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <p className="text-sm text-muted-foreground">
            To add money to this goal, create a transaction and select the 'Savings Goal' category.
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Form>
  );
}
