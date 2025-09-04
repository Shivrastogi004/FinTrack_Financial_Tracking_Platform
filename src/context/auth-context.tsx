
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { defaultData } from './app-context';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  
  const login = (email: string, pass: string) => {
    setIsNewUser(false); // Reset on login attempt
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const newUser = userCredential.user;
    if (newUser) {
      // Create the user document immediately upon registration
      const userDocRef = doc(db, 'users', newUser.uid);
      await setDoc(userDocRef, defaultData);
      setIsNewUser(true); // Set explicitly for the session
    }
    return userCredential;
  };

  const logout = async () => {
    await signOut(auth);
    setIsNewUser(false);
    router.push('/');
  };

  const value = { user, loading, isNewUser, login, register, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
