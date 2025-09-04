
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

const defaultGoal: Goal = {
  id: 'g1',
  name: 'Save for a new laptop',
  targetAmount: 500,
  currentAmount: 0,
};

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
    goal: defaultGoal,
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
  goal: Goal;
  setGoal: (goal: Omit<Goal, 'currentAmount'>) => void;
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
  const goalDetails = appData.goal || defaultGoal;
  const dailyStreak = appData.dailyStreak || 1;
  const lastLoginDate = appData.lastLoginDate || new Date().toISOString().split('T')[0];
  const achievements = appData.achievements || defaultAchievements;
  const profile = appData.profile || defaultProfile;

  const goal = useMemo(() => {
    const currentAmount = transactions
        .filter(t => t.category === 'Savings Goal')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { ...goalDetails, currentAmount };
  }, [transactions, goalDetails]);

  const addTransaction = (transaction: Transaction) => {
    const newTransactions = [transaction, ...transactions];
    updateFirestore({ transactions: newTransactions });
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
  
  const setGoal = (newGoalDetails: Omit<Goal, 'currentAmount'>) => {
    const newGoal = { ...newGoalDetails, currentAmount: goal.currentAmount };
    updateFirestore({ goal: sanitizeObject(newGoal) });
  };

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
                title: (
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-400" />
                        <span className="font-semibold">Achievement Unlocked!</span>
                    </div>
                ),
                description: `You've earned the "${achievementName}" medal.`,
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
          
          switch (t.recurrencePeriod) {
            case 'daily': nextDueDate = addDays(nextDueDate, 1); break;
            case 'weekly': nextDueDate = addWeeks(nextDueDate, 1); break;
            case 'monthly': nextDueDate = addMonths(nextDueDate, 1); break;
            case 'yearly': nextDueDate = addYears(nextDueDate, 1); break;
            default: 
              // Break the loop if something is wrong
              nextDueDate = addYears(nextDueDate, 100); 
              break;
          }
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
    goal,
    setGoal,
    dailyStreak,
    setDailyStreak,
    lastLoginDate,
    setLastLoginDate,
    achievements,
    unlockAchievement,
    profile,
    updateProfile,
    isDataLoading,
  }), [transactions, budgets, goal, dailyStreak, lastLoginDate, achievements, profile, isDataLoading, unlockAchievement, updateProfile, addTransaction, updateTransaction, deleteTransaction, addMultipleTransactions, addBudget, updateBudget, setGoal, setDailyStreak, setLastLoginDate]);

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
