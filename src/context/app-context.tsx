
'use client';

import React, { createContext, useContext, useState, useMemo, type ReactNode, useCallback, useEffect, useRef } from 'react';
import type { Transaction, Budget, Goal, Achievement, Profile, AppData } from '@/types';
import { addDays, addWeeks, addMonths, addYears, isBefore, isEqual, startOfToday } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Trophy } from 'lucide-react';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { sanitizeObject } from '@/lib/utils';

// Default data for a new user
const defaultProfile: Profile = {
    firstName: 'New',
    lastName: 'User',
    college: 'Your College',
    degree: 'Your Major',
    graduationYear: new Date().getFullYear() + 4,
};

const defaultGoals: Goal[] = [
  {
    id: 'g1',
    name: 'Save for a new laptop',
    targetAmount: 500,
    currentAmount: 0,
    allocation: 100,
  },
];

const defaultAchievements: Achievement[] = [
    { id: 'budget-master-food', name: 'Budget Master: Food', description: 'Keep your food spending under budget for a month.', achieved: false },
    { id: 'budget-master-entertainment', name: 'Budget Master: Entertainment', description: 'Keep your entertainment spending under budget for a month.', achieved: false },
    { id: 'budget-master-transportation', name: 'Budget Master: Transportation', description: 'Keep your transportation spending under budget for a month.', achieved: false },
    { id: 'budget-master-utilities', name: 'Budget Master: Utilities', description: 'Keep your utility spending under budget for a month.', achieved: false },
    { id: 'budget-master-rent', name: 'Budget Master: Rent', description: 'Keep your rent spending under budget for a month.', achieved: false },
    { id: 'on-a-roll-3', name: 'On a Roll!', description: 'Log in for 3 days in a row.', achieved: false },
    { id: 'weekly-warrior-7', name: 'Weekly Warrior', description: 'Log in for 7 days in a row.', achieved: false },
    { id: 'transaction-tracker-10', name: 'Transaction Tracker', description: 'Log at least 10 transactions.', achieved: false },
];


export const defaultData: AppData = sanitizeObject({
    transactions: [],
    budgets: [],
    goals: defaultGoals,
    achievements: defaultAchievements,
    profile: defaultProfile,
    lastLoginDate: new Date().toISOString().split('T')[0],
    dailyStreak: 1,
});


interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addMultipleTransactions: (newTransactions: Transaction[]) => void;
  budgets: Budget[];
  addBudget: (budget: Budget) => void;
  updateBudget: (budget: Budget) => void;
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'currentAmount'>) => void;
  updateGoal: (goal: Goal) => void;
  updateMultipleGoals: (goals: Goal[]) => void;
  deleteGoal: (id: string) => void;
  totalSavings: number;
  dailyStreak: number;
  setDailyStreak: (streak: number) => void;
  lastLoginDate: string;
  setLastLoginDate: (date: string) => void;
  achievements: Achievement[];
  unlockAchievement: (id: string) => void;
  profile: Profile;
  updateProfile: (profile: Profile) => void;
  isDataLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const { user, loading: isAuthLoading } = useAuth();
  const [appData, setAppData] = useState<AppData>(defaultData as AppData);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  // Effect to load and listen for user data from Firestore
  useEffect(() => {
    // Only run if auth is resolved and we have a user
    if (isAuthLoading || !user) {
      if (!isAuthLoading) {
        setIsDataLoading(false); // No user, so data loading is "finished"
        setAppData(defaultData as AppData);
      }
      return;
    }

    setIsDataLoading(true);
    isInitialMount.current = true; // Reset initial mount flag on user change
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppData;
        setAppData(data);
      } else {
        // Fallback if doc doesn't exist, though it should be created on register
        setDoc(userDocRef, defaultData);
        setAppData(defaultData as AppData);
      }
      setIsDataLoading(false);
    }, (error) => {
        console.error("Firestore snapshot error:", error);
        toast({ title: 'Connection Error', description: 'Could not connect to the database.', variant: 'destructive'});
        setIsDataLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAuthLoading, toast]);

  const updateFirestore = useCallback(async (data: Partial<AppData>) => {
    if (!user) return; // Don't update if there's no user.
    const userDocRef = doc(db, 'users', user.uid);
    try {
        // Sanitize the data before sending it to Firestore
        await setDoc(userDocRef, sanitizeObject(data), { merge: true });
    } catch (error) {
        console.error("Error updating document: ", error);
        toast({ title: 'Sync Error', description: 'Failed to save your changes.', variant: 'destructive'});
    }
  }, [user, toast]);


  const transactions = appData.transactions || [];
  const budgets = appData.budgets || [];
  const goalDetails = Array.isArray(appData.goals) ? appData.goals : defaultGoals;
  const dailyStreak = appData.dailyStreak || 1;
  const lastLoginDate = appData.lastLoginDate || new Date().toISOString().split('T')[0];
  const achievements = appData.achievements || defaultAchievements;
  const profile = appData.profile || defaultProfile;

 const { totalIncome, totalSpending } = useMemo(() => {
    return transactions.reduce(
      (acc, t) => {
        if (t.amount < 0) {
          acc.totalIncome += Math.abs(t.amount);
        } else {
          acc.totalSpending += t.amount;
        }
        return acc;
      },
      { totalIncome: 0, totalSpending: 0 }
    );
  }, [transactions]);

  const totalSavings = useMemo(() => totalIncome - totalSpending, [totalIncome, totalSpending]);

  const goals = useMemo(() => {
    // If savings are negative, no amount should be allocated to goals.
    const availableSavings = Math.max(0, totalSavings);
    return goalDetails.map(g => ({
      ...g,
      currentAmount: (availableSavings * g.allocation) / 100,
    }));
  }, [goalDetails, totalSavings]);


  const addTransaction = (transaction: Transaction) => {
    const today = startOfToday();
    const newTransactions: Transaction[] = [];

    // If it's a new recurring transaction, handle past instances
    if (transaction.isRecurring && transaction.nextDueDate) {
        let masterTransaction = { ...transaction };
        let nextDueDate = new Date(masterTransaction.date);

        // Loop to generate transactions from the start date up to today
        while (isBefore(nextDueDate, today) || isEqual(nextDueDate, today)) {
            newTransactions.push({
                ...masterTransaction,
                id: crypto.randomUUID(),
                date: nextDueDate.toISOString(),
                isAutoGenerated: true,
                isRecurring: false, // The generated instance is not recurring
                recurrencePeriod: undefined,
                nextDueDate: undefined,
            });

            // Increment to the next due date
            switch (masterTransaction.recurrencePeriod) {
                case 'daily': nextDueDate = addDays(nextDueDate, 1); break;
                case 'weekly': nextDueDate = addWeeks(nextDueDate, 1); break;
                case 'monthly': nextDueDate = addMonths(nextDueDate, 1); break;
                case 'yearly': nextDueDate = addYears(nextDueDate, 1); break;
                default:
                    // Stop if recurrence is not defined
                    nextDueDate = addYears(nextDueDate, 100);
                    break;
            }
        }
        
        // Update the master transaction with the correct next due date
        masterTransaction.nextDueDate = nextDueDate.toISOString();
        
        // Add the updated master transaction to the list
        newTransactions.push(masterTransaction);

        const updatedTransactions = [...newTransactions, ...transactions];
        updateFirestore({ transactions: updatedTransactions });

    } else {
        // It's a regular, non-recurring transaction
        const updatedTransactions = [transaction, ...transactions];
        updateFirestore({ transactions: updatedTransactions });
    }
  };

  const addMultipleTransactions = (newTransactions: Transaction[]) => {
    const updatedTransactions = [...newTransactions, ...transactions];
    updateFirestore({ transactions: updatedTransactions });
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    const newTransactions = transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t)
    updateFirestore({ transactions: newTransactions });
  };
  
  const deleteTransaction = (id: string) => {
    const newTransactions = transactions.filter(t => t.id !== id);
    updateFirestore({ transactions: newTransactions });
  };

  const addBudget = (budget: Budget) => {
    const newBudgets = [...budgets, budget];
    updateFirestore({ budgets: newBudgets });
  };

  const updateBudget = (updatedBudget: Budget) => {
    const newBudgets = budgets.map(b => b.id === updatedBudget.id ? updatedBudget : b)
    updateFirestore({ budgets: newBudgets });
  };
  
  const addGoal = (goal: Omit<Goal, 'id' | 'currentAmount'>) => {
    const newGoal: Goal = { ...goal, id: crypto.randomUUID(), currentAmount: 0 };
    const newGoals = [...goalDetails, newGoal];
    updateFirestore({ goals: sanitizeObject(newGoals.map(g => ({ ...g, currentAmount: undefined }))) });
  };
  
  const updateGoal = (updatedGoal: Goal) => {
    const newGoals = goalDetails.map(g => g.id === updatedGoal.id ? { ...g, ...updatedGoal } : g);
    updateFirestore({ goals: sanitizeObject(newGoals.map(g => ({ ...g, currentAmount: undefined }))) });
  };

  const updateMultipleGoals = (updatedGoals: Goal[]) => {
    updateFirestore({ goals: sanitizeObject(updatedGoals.map(g => ({ ...g, currentAmount: undefined }))) });
  };

  const deleteGoal = (id: string) => {
    const newGoals = goalDetails.filter(g => g.id !== id);
    updateFirestore({ goals: sanitizeObject(newGoals.map(g => ({ ...g, currentAmount: undefined }))) });
  }

  const setDailyStreak = (streak: number) => {
      updateFirestore({ dailyStreak: streak });
  };
  
  const setLastLoginDate = (date: string) => {
      updateFirestore({ lastLoginDate: date });
  };

  const updateProfile = (newProfile: Profile) => {
    updateFirestore({ profile: newProfile });
  };

  const unlockAchievement = useCallback((id: string) => {
    let achievementUnlocked = false;
    let achievementName = '';

    const currentAchievements = appData.achievements || defaultAchievements;

    const newAchievements = currentAchievements.map(ach => {
        if (ach.id === id && !ach.achieved) {
            achievementUnlocked = true;
            achievementName = ach.name;
            return { ...ach, achieved: true };
        }
        return ach;
    });

    if (achievementUnlocked) {
        updateFirestore({ achievements: newAchievements });
        setTimeout(() => {
            toast({
                title: 'Achievement Unlocked!',
                description: `🏆 You've earned the "${achievementName}" medal.`,
            });
        }, 500);
    }
  }, [appData.achievements, updateFirestore, toast]);
  
  // Effect to process recurring transactions
  useEffect(() => {
    if (isDataLoading || isInitialMount.current) {
        if(!isDataLoading) {
          isInitialMount.current = false;
        }
        return;
    }

    const today = startOfToday();
    const newTransactions: Transaction[] = [];
    let shouldUpdateState = false;
    
    const updatedMasterTransactions = transactions.map(t => {
      if (t.isRecurring && t.nextDueDate && (isBefore(new Date(t.nextDueDate), today) || isEqual(new Date(t.nextDueDate), today))) {
        let nextDueDate = new Date(t.nextDueDate);
        shouldUpdateState = true;

        while (isBefore(nextDueDate, today) || isEqual(nextDueDate, today)) {
          newTransactions.push({
            ...t,
            id: crypto.randomUUID(),
            date: nextDueDate.toISOString(),
            isAutoGenerated: true,
            isRecurring: false, // The generated instance is not recurring itself
            recurrencePeriod: undefined,
            nextDueDate: undefined,
          });
          
          let nextDate;
          switch (t.recurrencePeriod) {
            case 'daily': nextDate = addDays(nextDueDate, 1); break;
            case 'weekly': nextDate = addWeeks(nextDueDate, 1); break;
            case 'monthly': nextDate = addMonths(nextDueDate, 1); break;
            case 'yearly': nextDate = addYears(nextDueDate, 1); break;
            default: 
              // Break the loop if something is wrong
              nextDate = addYears(nextDueDate, 100); 
              break;
          }
          nextDueDate = nextDate;
        }
        
        // Return the master transaction with its next due date updated
        return { ...t, nextDueDate: nextDueDate.toISOString() };
      }
      return t;
    });

    if (shouldUpdateState) {
        const finalTransactions = [...updatedMasterTransactions, ...newTransactions];
        updateFirestore({ transactions: finalTransactions });
    }
  }, [isDataLoading, transactions, updateFirestore]);

  // Effect to check for budget achievements
  useEffect(() => {
    if (isDataLoading || isInitialMount.current) {
      return;
    }

    const spendingByCategory = transactions.reduce((acc, t) => {
        if (t.amount > 0) { // Count expenses only
            acc[t.category] = (acc[t.category] || 0) + t.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    budgets.forEach(budget => {
      const achievementId = `budget-master-${budget.category.toLowerCase().replace(' ', '-')}`;
      const spent = spendingByCategory[budget.category] || 0;
      if (spent > 0 && spent <= budget.target) {
        unlockAchievement(achievementId);
      }
    });
  }, [budgets, transactions, unlockAchievement, isDataLoading]);

  const value = useMemo(() => ({
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addMultipleTransactions,
    budgets,
    addBudget,
    updateBudget,
    goals,
    addGoal,
    updateGoal,
    updateMultipleGoals,
    deleteGoal,
    totalSavings,
    dailyStreak,
    setDailyStreak,
    lastLoginDate,
    setLastLoginDate,
    achievements,
    unlockAchievement,
    profile,
    updateProfile,
    isDataLoading,
  }), [transactions, budgets, goals, totalSavings, dailyStreak, lastLoginDate, achievements, profile, isDataLoading, unlockAchievement, updateProfile, addTransaction, updateTransaction, deleteTransaction, addMultipleTransactions, addBudget, updateBudget, addGoal, updateGoal, updateMultipleGoals, deleteGoal, setDailyStreak, setLastLoginDate]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
