
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Budget } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Edit } from 'lucide-react';
import { CategoryIcon } from './category-icon';

const budgetSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  target: z.coerce.number().positive('Target must be a positive number'),
});

const categories = ["Food", "Textbooks", "Transportation", "Entertainment", "Utilities", "Rent"];

export default function BudgetsView() {
  const { budgets, transactions, addBudget, updateBudget } = useAppContext();
  const [open, setOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const spendingByCategory = useMemo(() => {
    return transactions.reduce((acc, t) => {
        if (t.amount > 0) { // Only count expenses
            acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
    }, {} as Record<string, number>);
  }, [transactions]);

  const handleOpenDialog = (budget: Budget | null = null) => {
    setEditingBudget(budget);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingBudget(null);
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
         <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
            <p className="text-muted-foreground">Set and track monthly spending limits.</p>
         </div>
         <Button onClick={() => handleOpenDialog()} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Budget
        </Button>
       </div>
      
      {budgets.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            You haven't set any budgets yet. Get started by adding one!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
            const spent = spendingByCategory[budget.category] || 0;
            const progress = Math.min((spent / budget.target) * 100, 100);
            const isOverspent = spent > budget.target;
            const remaining = budget.target - spent;

            return (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CategoryIcon category={budget.category} className="h-6 w-6 text-muted-foreground" />
                        <CardTitle className="text-xl">{budget.category}</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenDialog(budget)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={progress} className={isOverspent ? '[&>div]:bg-destructive' : ''} />
                    <div className="flex justify-between text-sm font-medium">
                      <span>${spent.toFixed(2)} / ${budget.target.toFixed(2)}</span>
                       <span className={isOverspent ? 'text-destructive' : ''}>
                        {isOverspent 
                          ? `-$${Math.abs(remaining).toFixed(2)} over` 
                          : `$${remaining.toFixed(2)} left`}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Edit Budget' : 'Add Budget'}</DialogTitle>
          </DialogHeader>
          <BudgetForm 
            budget={editingBudget} 
            onSave={(budget) => {
              if(editingBudget) {
                updateBudget(budget);
              } else {
                addBudget(budget);
              }
              handleCloseDialog();
            }}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BudgetForm({ budget, onSave, onCancel }: { budget: Budget | null, onSave: (data: Budget) => void, onCancel: () => void }) {
  const { budgets } = useAppContext();
  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget || {
      category: '',
      target: 0,
    },
  });

  const onSubmit = (data: z.infer<typeof budgetSchema>) => {
    onSave({
      ...data,
      id: budget?.id || crypto.randomUUID(),
    });
  };

  const availableCategories = categories.filter(c => !budgets.some(b => b.category === c && b.id !== budget?.id));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!budget}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {budget && <SelectItem value={budget.category}>{budget.category}</SelectItem>}
                  {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monthly Target</FormLabel>
              <FormControl>
                <Input type="number" placeholder="300" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
