'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';
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

export function CsvImport() {
  const { addMultipleTransactions } = useAppContext();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a CSV file to import.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').slice(1); // Skip header row
        const newTransactions: Transaction[] = rows
          .map((row, index) => {
            const columns = row.split(',');
            if (columns.length < 3) return null; // Basic validation

            const [dateStr, merchant, amountStr, category = 'Other'] = columns;

            const amount = parseFloat(amountStr);
            if (isNaN(amount)) {
                console.warn(`Skipping row ${index + 2}: Invalid amount`);
                return null;
            }

            return {
              id: crypto.randomUUID(),
              date: new Date(dateStr).toISOString(),
              merchant: merchant.trim(),
              amount: amount,
              category: category.trim() || 'Other',
            };
          })
          .filter((t): t is Transaction => t !== null);

        addMultipleTransactions(newTransactions);
        toast({ title: 'Import successful', description: `${newTransactions.length} transactions have been added.` });
        setOpen(false);
        setFile(null);
      } catch (error) {
        toast({ title: 'Import failed', description: 'There was an error processing your file.', variant: 'destructive' });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file to import. The file should have columns in this order: date, merchant, amount, category (optional).
          </DialogDescription>
        </DialogHeader>
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
          <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancel</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isLoading || !file}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
