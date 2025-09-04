
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
    const { register, user, loading } = useAuth();
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
    
    if (!isMounted || loading || user) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

  return (
     <div className="w-full lg:grid lg:min-h-[100vh] lg:grid-cols-2 xl:min-h-[100vh]">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[400px] gap-6">
          <div className="grid gap-2 text-center">
             <div className="flex justify-center items-center gap-2 mb-4">
                <Logo className="h-8 w-8" />
                <h1 className="text-3xl font-bold">FinTrack</h1>
            </div>
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
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/" className="underline">
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
