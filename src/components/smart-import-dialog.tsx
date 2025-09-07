'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Transaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Sparkles, AlertTriangle } from 'lucide-react';
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
import { extractTransactionsFromDocument, type ExtractTransactionsOutput } from '@/ai/flows/extract-transactions-from-document';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { CategoryIcon } from './category-icon';

export function SmartImportDialog() {
  const { addMultipleTransactions } = useAppContext();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractTransactionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
      setFile(null);
      setIsLoading(false);
      setExtractedData(null);
      setError(null);
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    setOpen(isOpen);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFile(event.target.files[0]);
      setExtractedData(null); // Reset previous results if a new file is chosen
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({ title: 'No file selected', description: 'Please select a file to analyze.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    setExtractedData(null);
    setError(null);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
        try {
            const documentDataUri = e.target?.result as string;
            if (!documentDataUri) throw new Error("Could not read the file.");

            const result = await extractTransactionsFromDocument({ documentDataUri });

            if (!result.transactions || result.transactions.length === 0) {
              setError("The AI could not find any transactions in this document. Please try a different file.");
            } else {
              setExtractedData(result);
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred while analyzing the document. The file might be unsupported or corrupt.");
            toast({ title: 'Analysis Failed', description: 'There was an error processing your file.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
     reader.onerror = () => {
      setIsLoading(false);
      setError("Failed to read the file.");
      toast({ title: 'File Read Error', description: 'Could not read the selected file.', variant: 'destructive' });
    };
  };

  const handleImport = () => {
      if (!extractedData || !extractedData.transactions || extractedData.transactions.length === 0) {
          toast({ title: 'No transactions to import', variant: 'destructive' });
          return;
      }
      const newTransactions: Transaction[] = extractedData.transactions.map(t => ({
        ...t,
        id: crypto.randomUUID(),
        date: new Date(t.date).toISOString(), // Ensure date is in ISO format
      }));

      addMultipleTransactions(newTransactions);
      toast({ title: 'Import successful!', description: `${newTransactions.length} transactions have been added.` });
      handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Sparkles className="mr-2 h-4 w-4" />
          Smart Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>AI-Powered Smart Import</DialogTitle>
          <DialogDescription>
            Upload a document (CSV, PDF, or even a screenshot of a statement) and our AI will automatically extract the transactions for you.
          </DialogDescription>
        </DialogHeader>
        
        {!extractedData && (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Input id="doc-file" type="file" accept=".csv,.pdf,image/*" onChange={handleFileChange} disabled={isLoading} />
                </div>
                {error && (
                  <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <p>{error}</p>
                  </div>
                )}
                 <Button onClick={handleAnalyze} disabled={isLoading || !file} className="mt-4">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isLoading ? 'Analyzing Document...' : 'Analyze Document'}
                </Button>
            </div>
        )}

        {extractedData && (
            <div>
                <h3 className="text-lg font-semibold mb-2">Review Extracted Transactions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Here's what our AI found in the document. Review the transactions below before importing them.
                </p>
                <div className="max-h-[400px] overflow-y-auto border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {extractedData.transactions.map((t, index) => (
                                <TableRow key={index}>
                                <TableCell>{format(new Date(t.date), 'MMM d, yyyy')}</TableCell>
                                <TableCell>{t.merchant}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <CategoryIcon category={t.category} className="h-4 w-4 text-muted-foreground" />
                                        {t.category}
                                    </div>
                                </TableCell>
                                <TableCell className={`text-right font-medium ${t.amount < 0 ? 'text-green-500' : ''}`}>
                                    {t.amount < 0 ? `+ $${Math.abs(t.amount).toFixed(2)}` : ` - $${t.amount.toFixed(2)}`}
                                </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                 <DialogFooter className="mt-6">
                    <Button type="button" variant="ghost" onClick={() => setExtractedData(null)}>Analyze a different file</Button>
                    <Button onClick={handleImport}>
                        <Upload className="mr-2 h-4 w-4" /> Import {extractedData.transactions.length} Transactions
                    </Button>
                </DialogFooter>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
