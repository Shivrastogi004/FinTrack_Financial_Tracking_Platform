
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddTransactionDialog, TransactionFormDialog } from './transaction-form';
import { SmartImportDialog } from './smart-import-dialog';
import { CategoryIcon } from './category-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Repeat, Download, Trash2, Edit, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
} from '@/components/ui/alert-dialog';


const categories = ["All", "Food", "Textbooks", "Transportation", "Entertainment", "Utilities", "Rent", "Salary", "Savings Goal", "Other"];

export default function TransactionsView() {
  const { transactions, unlockAchievement, deleteTransaction } = useAppContext();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    // We want to see the generated instances, but not the master recurring transaction
    const nonMasterRecurring = sortedTransactions.filter(t => !t.isRecurring);
    if (categoryFilter === 'All') return nonMasterRecurring;
    return nonMasterRecurring.filter(t => t.category === categoryFilter);
  }, [sortedTransactions, categoryFilter]);

  const handleEditClick = (transaction: Transaction) => {
    if(transaction.isRecurring) return; // Should not happen with current filter
    setEditingTransaction(transaction);
    if(transactions.length >= 10){
      unlockAchievement('transaction-tracker-10');
    }
  }

  const handleDownload = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Amount', 'Category'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => 
        [
          t.id,
          format(new Date(t.date), 'yyyy-MM-dd'),
          `"${t.merchant.replace(/"/g, '""')}"`,
          t.amount,
          t.category
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', 'fintrack_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <SmartImportDialog />
          <AddTransactionDialog />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>History</CardTitle>
            <div className="w-48">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Details</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px] text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={t.category} className="h-8 w-8 text-muted-foreground bg-accent p-1.5 rounded-full" />
                        <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1.5">
                              {t.merchant}
                              {t.isAutoGenerated && (
                                <>
                                  <Repeat className="h-3 w-3 text-muted-foreground" />
                                  <span className="sr-only">Recurring</span>
                                </>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground"><Badge variant="outline">{t.category}</Badge></span>
                        </div>
                      </div>
                    </TableCell>
                     <TableCell className="text-muted-foreground">{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.amount < 0 ? 'text-green-600 dark:text-green-500' : 'text-foreground'}`}>
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
                          <DropdownMenuItem onClick={() => handleEditClick(t)}>
                            <Edit className="mr-2 h-4 w-4" />
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
                                    This action cannot be undone. This will permanently delete this transaction.
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
                  <TableCell colSpan={4} className="text-center h-24">No transactions found for this filter.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Dialog open={!!editingTransaction} onOpenChange={(isOpen) => !isOpen && setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
            <DialogDescription>Update the details of your transaction.</DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <TransactionFormDialog transaction={editingTransaction} onFinish={() => setEditingTransaction(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
