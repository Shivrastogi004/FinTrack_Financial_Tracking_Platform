
'use client';

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Transaction } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AddTransactionDialog, TransactionFormDialog } from './transaction-form';
import { SmartImportDialog } from './smart-import-dialog';
import { CategoryIcon } from './category-icon';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Repeat, Download, Trash2, Edit } from 'lucide-react';
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
    const nonMasterRecurring = sortedTransactions.filter(t => !t.isRecurring);
    if (categoryFilter === 'All') return nonMasterRecurring;
    return nonMasterRecurring.filter(t => t.category === categoryFilter);
  }, [sortedTransactions, categoryFilter]);

  const handleEditClick = (transaction: Transaction) => {
    if(transaction.isRecurring) return;
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
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={handleDownload} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Download CSV
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <SmartImportDialog />
             <AddTransactionDialog />
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>History</CardTitle>
            <div className="w-full sm:w-48">
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
          <div className="space-y-4">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-3 gap-4 px-4 py-2 font-medium text-muted-foreground border-b">
              <div className="col-span-1">Details</div>
              <div className="col-span-1 text-center hidden lg:block">Date</div>
              <div className="col-span-1 text-right">Amount</div>
            </div>

            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((t) => (
                <div key={t.id} className="grid grid-cols-2 md:grid-cols-3 items-center gap-4 px-4 py-3 border-b hover:bg-muted/50 rounded-lg md:border-none md:rounded-none">
                  {/* Details */}
                  <div className="col-span-2 md:col-span-1 flex items-center gap-3">
                    <CategoryIcon category={t.category} className="h-8 w-8 text-muted-foreground bg-accent p-1.5 rounded-full" />
                    <div className="flex flex-col">
                      <span className="font-medium flex items-center gap-1.5">
                        {t.merchant}
                        {t.isAutoGenerated && <Repeat className="h-3 w-3 text-muted-foreground" title="Recurring"/>}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        <Badge variant="outline">{t.category}</Badge>
                      </span>
                      {/* Mobile-only Date */}
                      <span className="text-xs text-muted-foreground mt-1 md:hidden">
                        {format(new Date(t.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>

                  {/* Desktop-only Date */}
                  <div className="hidden lg:flex justify-center text-muted-foreground">{format(new Date(t.date), 'MMM d, yyyy')}</div>

                  {/* Amount and Actions */}
                  <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-2">
                    <p className={`font-semibold ${t.amount < 0 ? 'text-green-600 dark:text-green-500' : 'text-foreground'}`}>
                      {t.amount < 0 ? `+ $${Math.abs(t.amount).toFixed(2)}` : `- $${t.amount.toFixed(2)}`}
                    </p>
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
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                No transactions found for this filter.
              </div>
            )}
          </div>
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
