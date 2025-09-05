
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Goal } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Edit, PlusCircle, Trash2, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { CategoryIcon } from './category-icon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast';
import { getSmartGoalAllocations } from '../ai/flows/get-smart-goal-allocations';


const goalSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Goal name must be at least 3 characters'),
  targetAmount: z.coerce.number().positive('Target amount must be a positive number'),
  allocation: z.coerce.number().min(0, 'Allocation cannot be negative').max(100, 'Allocation cannot exceed 100%'),
});

export default function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal, totalSavings, updateMultipleGoals } = useAppContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);
  const { toast } = useToast();

  const totalAllocation = useMemo(() => {
    return goals.reduce((sum, goal) => sum + goal.allocation, 0);
  }, [goals]);

  const handleOpenDialog = (goal: Goal | null = null) => {
    setEditingGoal(goal);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingGoal(null);
    setDialogOpen(false);
  };

  const handleSaveGoal = (data: z.infer<typeof goalSchema>) => {
    if (editingGoal) {
      updateGoal({ ...editingGoal, ...data });
    } else {
      addGoal({
        name: data.name!,
        targetAmount: data.targetAmount!,
        allocation: data.allocation!
      });
    }
    handleCloseDialog();
  };

  const handleSmartAllocate = async () => {
    if (goals.length === 0) {
      toast({
        title: 'No Goals to Allocate',
        description: 'Please add at least one goal before using Smart Allocate.',
        variant: 'destructive'
      });
      return;
    }
    setIsAllocating(true);
    try {
      const result = await getSmartGoalAllocations({
        goals: goals.map(({ id, name, targetAmount, currentAmount }) => ({ id, name, targetAmount, currentAmount })),
        totalMonthlySavings: totalSavings > 0 ? totalSavings : 0 // Pass 0 if savings are negative
      });

      if (result && result.allocations) {
        const updatedGoals = goals.map(goal => {
          const newAllocation = result.allocations.find(a => a.goalId === goal.id);
          return newAllocation ? { ...goal, allocation: newAllocation.percentage } : goal;
        });
        updateMultipleGoals(updatedGoals);
        toast({
          title: 'Smart Allocation Successful!',
          description: 'Your savings have been intelligently allocated across your goals.',
        });
      } else {
         throw new Error("AI did not return valid allocations.");
      }

    } catch (error) {
      console.error("Smart allocation failed:", error);
      toast({
        title: 'AI Error',
        description: 'Could not get smart allocations at this time. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsAllocating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
          <p className="text-muted-foreground">Your automatically allocated savings goals.</p>
        </div>
         <div className="flex items-center gap-2">
            <Button onClick={handleSmartAllocate} variant="outline" disabled={isAllocating || goals.length === 0}>
                {isAllocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Smart Allocate
            </Button>
            <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Goal
            </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Monthly Savings</CardTitle>
          <CardDescription>This is your total income minus expenses for the period. It's automatically distributed to your goals below.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-4xl font-bold ${totalSavings >= 0 ? '' : 'text-destructive'}`}>${totalSavings.toFixed(2)}</p>
        </CardContent>
      </Card>
      
      {totalAllocation > 100 && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive flex items-center gap-3">
          <AlertTriangle className="h-5 w-5"/>
          <div>
            <h4 className="font-semibold">Over-allocated!</h4>
            <p className="text-sm">Your total goal allocation is {totalAllocation}%. It should not exceed 100%. Please adjust your goals or use Smart Allocate.</p>
          </div>
        </div>
      )}

      {goals.length === 0 ? (
        <Card className="text-center py-10">
          <CardContent>
            <p className="text-muted-foreground">You haven't set any financial goals yet. Add one to get started!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category="Savings Goal" className="h-6 w-6 text-muted-foreground" />
                      <CardTitle>{goal.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(goal)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete your "{goal.name}" goal. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteGoal(goal.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                   <CardDescription className="pt-2">
                    Receives {goal.allocation}% of total savings.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${goal.currentAmount.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">of ${goal.targetAmount.toFixed(2)}</div>
                  <Progress value={progress} className="mt-2 h-2" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>{editingGoal ? 'Edit Financial Goal' : 'Add New Goal'}</DialogTitle>
              </DialogHeader>
              <GoalForm
                  goal={editingGoal}
                  onSave={handleSaveGoal}
                  onCancel={handleCloseDialog}
              />
          </DialogContent>
      </Dialog>
    </div>
  );
}

function GoalForm({ goal, onSave, onCancel }: { goal: Goal | null; onSave: (data: z.infer<typeof goalSchema>) => void; onCancel: () => void }) {
  const { goals } = useAppContext();
  const { toast } = useToast();

  const totalAllocationWithoutCurrent = useMemo(() => {
    return goals.reduce((sum, g) => (g.id !== goal?.id ? sum + g.allocation : sum), 0);
  }, [goals, goal]);

  const form = useForm<z.infer<typeof goalSchema>>({
    resolver: zodResolver(goalSchema),
    defaultValues: goal || {
      name: '',
      targetAmount: 0,
      allocation: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof goalSchema>) => {
    const newTotalAllocation = totalAllocationWithoutCurrent + data.allocation;
    if (newTotalAllocation > 100) {
      toast({
        title: 'Allocation Limit Exceeded',
        description: `Your total allocation cannot exceed 100%. You have ${100 - totalAllocationWithoutCurrent}% remaining.`,
        variant: 'destructive',
      });
      return;
    }
    
    onSave(data);
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
                <Input placeholder="e.g., Spring Break Trip" {...field} />
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
              <FormLabel>Target Amount ($)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="allocation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Savings Allocation (%)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50" {...field} />
              </FormControl>
              <FormDescription>
                What percentage of your total monthly savings should go to this goal?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save Goal</Button>
        </div>
      </form>
    </Form>
  );
}
