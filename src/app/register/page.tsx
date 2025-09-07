
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/icons/logo';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';


export default function RegisterPage() {
    const router = useRouter();
    const { register, loginWithGoogle, user, loading } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && !loading && user) {
            router.push('/dashboard');
        }
    }, [user, loading, router, isMounted]);

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsSubmitting(true);
        const form = event.target as HTMLFormElement;
        const email = form.email.value;
        const password = form.password.value;
        
        try {
            await register(email, password);
            // Let the useEffect handle the redirect
        } catch (error: any) {
            toast({
                title: 'Registration Failed',
                description: error.message || 'An unexpected error occurred.',
                variant: 'destructive',
            });
            setIsSubmitting(false);
        }
    };

     const handleGoogleLogin = async () => {
        setIsSubmitting(true);
        try {
            await loginWithGoogle();
            // Let the useEffect handle the redirect
        } catch (error) {
            // Error is already handled by toast in auth context
            setIsSubmitting(false);
        }
    };
    
    if (!isMounted || loading || user) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

  return (
     <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4">
        <div className="mx-auto grid w-full max-w-[400px] gap-6">
          <div className="grid gap-2 text-center">
             <Link href="/" className="flex justify-center items-center gap-2 mb-4">
                <Logo className="h-8 w-8" />
                <h1 className="text-3xl font-bold">FinTrack</h1>
            </Link>
            <p className="text-balance text-muted-foreground">
                Create an account to start managing your finances.
            </p>
          </div>
          <form onSubmit={handleRegister} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" name="firstName" placeholder="Max" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" name="lastName" placeholder="Robinson" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required/>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create an account
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                 <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 23.4 172.9 61.9l-72.2 68.7C297.6 112.5 275.2 104 248 104c-58.4 0-108.3 49.3-115.1 113.8h230.8c2.1-12.2 3.2-24.6 3.2-37.2zM248 40C129.1 40 32 137.1 32 256s97.1 216 216 216c125.4 0 216-91.3 216-210.3 0-15.3-.9-30.2-2.7-44.9H248v89.8h138.8c-6.1 31.3-24.7 59.8-50.8 77.8z"></path></svg>
              )}
              Sign up with Google
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </div>
        </div>
         <div className="hidden bg-muted lg:flex items-center justify-center p-10 flex-col">
          <div className="relative w-full max-w-md">
            <Card className="p-8 bg-background shadow-2xl rounded-xl">
                 <CardHeader>
                    <CardTitle className="text-2xl">Take Control of Your College Finances</CardTitle>                    <CardDescription>FinTrack helps you budget, save, and understand your spending so you can focus on what matters most - your education.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4 text-sm text-muted-foreground">
                        <li className="flex items-start">
                            <ArrowRight className="w-4 h-4 mr-2 mt-1 text-primary shrink-0"/> 
                            <span>Track every penny with smart, AI-powered categorization.</span>
                        </li>
                        <li className="flex items-start">
                            <ArrowRight className="w-4 h-4 mr-2 mt-1 text-primary shrink-0"/> 
                            <span>Set and crush your financial goals, one step at a time.</span>
                        </li>
                        <li className="flex items-start">
                             <ArrowRight className="w-4 h-4 mr-2 mt-1 text-primary shrink-0"/> 
                            <span>Visualize your spending habits with insightful charts.</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
