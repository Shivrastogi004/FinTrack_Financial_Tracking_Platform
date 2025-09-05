
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { CalendarIcon, Wand2, Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { categorizeTransaction } from '@/ai/flows/categorize-transaction';
import type { Transaction } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const transactionSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['expense', 'income'], { required_error: 'You must select a transaction type.' }),
  merchant: z.string().min(1, 'Merchant is required'),
  amount: z.coerce.number().positive('Amount must be a positive number.'),
  date: z.date({ required_error: 'Date is required' }),
  category: z.string().min(1, 'Category is required'),
  isRecurring: z.boolean().default(false),
  recurrencePeriod: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
}).refine(data => !data.isRecurring || !!data.recurrencePeriod, {
    message: 'Recurrence frequency is required for recurring transactions.',
    path: ['recurrencePeriod'],
});


const categories = ["Food", "Textbooks", "Transportation", "Entertainment", "Utilities", "Rent", "Salary", "Savings Goal", "Other"];

export function TransactionFormDialog({ transaction, onFinish }: { transaction?: Transaction, onFinish: () => void }) {
  const { addTransaction, updateTransaction } = useAppContext();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction ? {
      ...transaction,
      type: transaction.amount < 0 ? 'income' : 'expense',
      amount: Math.abs(transaction.amount),
      date: new Date(transaction.date),
      isRecurring: transaction.isRecurring || false,
    } : {
      type: 'expense',
      merchant: '',
      amount: 0,
      date: new Date(),
      category: '',
      isRecurring: false,
    },
  });

  const [isCategorizing, setIsCategorizing] = useState(false);
  const isRecurring = form.watch('isRecurring');

  const handleAutoCategorize = async () => {
    const description = form.getValues('merchant');
    if (!description) {
      toast({ title: 'Merchant name is empty', description: 'Please enter a merchant name to categorize.', variant: 'destructive' });
      return;
    }
    setIsCategorizing(true);
    try {
      const result = await categorizeTransaction({ description });
      const matchedCategory = categories.find(c => c.toLowerCase() === result.category.toLowerCase()) || 'Other';
      form.setValue('category', matchedCategory, { shouldValidate: true });
      toast({ title: 'Auto-categorization successful!', description: `Transaction categorized as ${matchedCategory}.` });
    } catch (error) {
      console.error('Failed to categorize:', error);
      toast({ title: 'Categorization failed', description: 'Could not automatically categorize this transaction.', variant: 'destructive' });
    } finally {
      setIsCategorizing(false);
    }
  };

  const onSubmit = (data: z.infer<typeof transactionSchema>) => {
    const finalAmount = data.type === 'income' ? -Math.abs(data.amount) : Math.abs(data.amount);
    
    const newTransaction: Transaction = {
      id: transaction?.id || crypto.randomUUID(),
      amount: finalAmount,
      date: data.date.toISOString(),
      merchant: data.merchant,
      category: data.category,
      type: data.type,
      isRecurring: data.isRecurring,
      recurrencePeriod: data.recurrencePeriod,
      nextDueDate: undefined, // Default to undefined
    };

    if (newTransaction.isRecurring && data.recurrencePeriod) {
        let nextDate = new Date(data.date);
        switch (data.recurrencePeriod) {
            case 'daily': nextDate = addDays(nextDate, 1); break;
            case 'weekly': nextDate = addWeeks(nextDate, 1); break;
            case 'monthly': nextDate = addMonths(nextDate, 1); break;
            case 'yearly': nextDate = addYears(nextDate, 1); break;
        }
        newTransaction.nextDueDate = nextDate.toISOString();
    }
    
    if (transaction) {
      updateTransaction(newTransaction);
      toast({ title: 'Transaction updated' });
    } else {
      addTransaction(newTransaction);
      toast({ title: 'Transaction added' });
    }
    onFinish();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
         <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Transaction Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center space-x-4"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="expense" />
                    </FormControl>
                    <FormLabel className="font-normal">Expense</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="income" />
                    </FormControl>
                    <FormLabel className="font-normal">Income</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="merchant"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Starbucks, Paycheck" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
                <FormLabel className="opacity-0 hidden sm:block">AI</FormLabel>
                <Button type="button" variant="outline" size="icon" onClick={handleAutoCategorize} disabled={isCategorizing}>
                    {isCategorizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    <span className="sr-only">Auto Categorize</span>
                </Button>
            </FormItem>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="25.50"
                  {...field}
                  onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  value={field.value === 0 ? '' : field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Recurring Transaction</FormLabel>
                <FormDescription className="text-xs text-muted-foreground">
                  Is this a regular bill or income?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        {isRecurring && (
           <FormField
              control={form.control}
              name="recurrencePeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="How often does this repeat?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
        )}


        <DialogFooter className="pt-4">
           <Button type="button" variant="ghost" onClick={onFinish}>Cancel</Button>
           <Button type="submit">Save Transaction</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Transaction</DialogTitle>
          <DialogDescription>Select whether this is an expense or income, then enter the details below.</DialogDescription>
        </DialogHeader>
        <TransactionFormDialog onFinish={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
