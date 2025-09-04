
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { TransactionFormDialog, AddTransactionDialog } from './transaction-form';
import { CategoryIcon } from './category-icon';
import { format } from 'date-fns';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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


export default function RecurringView() {
  const { transactions, deleteTransaction } = useAppContext();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const recurringTransactions = useMemo(() => {
    return transactions.filter(t => t.isRecurring);
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Recurring</h1>
            <p className="text-muted-foreground">Manage your recurring bills, subscriptions, and income.</p>
        </div>
        <AddTransactionDialog />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Transactions</CardTitle>
          <CardDescription>
            These are your upcoming or regularly scheduled transactions. New transactions will be created automatically on their due date.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Details</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringTransactions.length > 0 ? (
                recurringTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={t.category} className="h-8 w-8 text-muted-foreground bg-accent p-1.5 rounded-full" />
                        <div>
                          <p className="font-medium">{t.merchant}</p>
                          <p className="text-sm text-muted-foreground">{t.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{t.recurrencePeriod}</TableCell>
                    <TableCell>{t.nextDueDate ? format(new Date(t.nextDueDate), 'MMM d, yyyy') : 'N/A'}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.amount < 0 ? 'text-green-600' : ''}`}>
                      {t.amount < 0 ? `+ $${Math.abs(t.amount).toFixed(2)}` : `- $${t.amount.toFixed(2)}`}
                    </TableCell>
                     <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingTransaction(t)}>
                            Edit
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete this recurring transaction and it will no longer generate future transactions.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteTransaction(t.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No recurring transactions found. Add one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Transaction</DialogTitle>
            <DialogDescription>Update the details of your scheduled transaction.</DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <TransactionFormDialog transaction={editingTransaction} onFinish={() => setEditingTransaction(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
