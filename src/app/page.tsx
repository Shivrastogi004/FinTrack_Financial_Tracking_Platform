
'use client';

import React, { useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Logo from '@/components/icons/logo';
import { ArrowRight, BarChart2, BrainCircuit, ShieldCheck, Target, TrendingUp, Wallet, Mail, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { saveContactMessage } from '@/app/actions/contact';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import Testimonials from '@/components/testimonials';
import { Skeleton } from '@/components/ui/skeleton';

function ContactForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [messageType, setMessageType] = useState<'question' | 'testimonial'>('question');
    const { toast } = useToast();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const result = await saveContactMessage(formData);
        
        if (result.success) {
            toast({
                title: 'Message Sent!',
                description: 'Thanks for reaching out. We\'ll get back to you soon.',
            });
            formRef.current?.reset();
            setMessageType('question'); // Reset selection
        } else {
             toast({
                title: 'Error',
                description: result.error || 'Something went wrong. Please try again.',
                variant: 'destructive',
            });
        }

        setIsSubmitting(false);
    }
    
    return (
         <Card>
            <CardContent className="p-6">
                <form ref={formRef} onSubmit={handleSubmit} className="grid gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="first-name">First Name</Label>
                        <Input id="first-name" name="firstName" placeholder="John" required />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="last-name">Last Name</Label>
                        <Input id="last-name" name="lastName" placeholder="Doe" required />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="john.doe@example.com" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Message Type</Label>
                        <RadioGroup name="messageType" defaultValue="question" onValueChange={(value: 'question' | 'testimonial') => setMessageType(value)} className="flex flex-col sm:flex-row gap-4">
                            <Label className="flex items-center gap-2 font-normal cursor-pointer">
                                <RadioGroupItem value="question" id="type-question" />
                                Question / Query
                            </Label>
                             <Label className="flex items-center gap-2 font-normal cursor-pointer">
                                <RadioGroupItem value="testimonial" id="type-testimonial" />
                                Testimonial / Feedback
                            </Label>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea id="message" name="message" placeholder="Your message..." className="min-h-[100px]" required/>
                    </div>
                    
                    {messageType === 'testimonial' && (
                        <div className="items-top flex space-x-2">
                            <Checkbox id="consentToDisplay" name="consentToDisplay" />
                            <div className="grid gap-1.5 leading-none">
                                <label
                                htmlFor="consentToDisplay"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                I agree to let FinTrack use this testimonial on the website.
                                </label>
                                <p className="text-sm text-muted-foreground">
                                We'll only show your first name and last initial.
                                </p>
                            </div>
                        </div>
                    )}


                     <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="ml-2 h-4 w-4" />}
                        Send Message
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Link href="#" className="flex items-center justify-center gap-2" prefetch={false}>
          <Logo className="h-6 w-6" />
          <span className="text-xl font-bold">FinTrack</span>
        </Link>
        <nav className="ml-auto flex items-center gap-2 sm:gap-4">
          <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:inline-block" prefetch={false}>
            Features
          </Link>
          <Link href="#why" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:inline-block" prefetch={false}>
            Why FinTrack
          </Link>
          <Link href="#contact" className="text-sm font-medium hover:underline underline-offset-4 hidden sm:inline-block" prefetch={false}>
           Contact
          </Link>
           <Link href="/login" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
            Login
          </Link>
          <Button asChild size="sm">
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/10 via-background to-background">
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-4">
               <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-indigo-600">
                Master Your Money, Master Your Future
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                FinTrack is the AI-powered finance app designed for college students. Stop stressing about money and start building a solid financial foundation for life after graduation.
              </p>
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started for Free <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <p className="text-sm font-semibold tracking-wide text-muted-foreground">TRUSTED BY STUDENTS AT TOP UNIVERSITIES</p>
                     <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 lg:gap-16 text-muted-foreground">
                        <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
                            <Logo className="w-7 h-7 text-primary" /><span>State University</span>
                        </div>
                         <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
                            <Logo className="w-7 h-7 text-primary" /><span>Tech Institute</span>
                        </div>
                         <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
                            <Logo className="w-7 h-7 text-primary" /><span>City College</span>
                        </div>
                         <div className="flex items-center gap-2 font-bold text-lg sm:text-xl">
                            <Logo className="w-7 h-7 text-primary" /><span>National University</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Everything You Need to Succeed Financially</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  From effortless expense tracking to AI-powered financial advice, FinTrack is your personal financial genius.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 pt-12">
              <div className="grid gap-1 rounded-lg border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold flex items-center gap-2"><BrainCircuit className="text-primary"/> AI Smart Import</h3>
                <p className="text-sm text-muted-foreground">
                  Forget manual entry. Upload a bank statement (PDF, CSV, or even a screenshot!) and let our AI extract and categorize every transaction automatically.
                </p>
              </div>
              <div className="grid gap-1 rounded-lg border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold flex items-center gap-2"><Wallet className="text-primary"/> Dynamic Budgeting</h3>
                <p className="text-sm text-muted-foreground">
                  Set monthly budgets for categories like food, transport, and fun. We'll show you exactly where your money is going and help you stick to your plan.
                </p>
              </div>
              <div className="grid gap-1 rounded-lg border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold flex items-center gap-2"><Target className="text-primary"/> Multi-Goal Savings</h3>
                <p className="text-sm text-muted-foreground">
                  Saving for a new laptop, a spring break trip, and an emergency fund? Create multiple goals and let our AI suggest the smartest way to allocate your savings.
                </p>
              </div>
              <div className="grid gap-1 rounded-lg border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold flex items-center gap-2"><TrendingUp className="text-primary"/> AI Investment Advisor</h3>
                <p className="text-sm text-muted-foreground">
                  Ready to make your money work for you? Get simple, actionable investment advice on stocks and learn the basics of growing your wealth.
                </p>
              </div>
              <div className="grid gap-1 rounded-lg border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold flex items-center gap-2"><BarChart2 className="text-primary"/> Insightful Dashboard</h3>
                <p className="text-sm text-muted-foreground">
                  See your complete financial picture at a glance. Track income, expenses, savings, and goal progress with beautiful, easy-to-understand charts.
                </p>
              </div>
               <div className="grid gap-1 rounded-lg border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow">
                <h3 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="text-primary"/> Secure & Private</h3>
                <p className="text-sm text-muted-foreground">
                  Your financial data is yours alone. We use bank-level security and Firebase to ensure your information is always safe and protected.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container grid items-center gap-10 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
                <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Why FinTrack?</div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Built for Students, By Design</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Generic finance apps don't get it. They're built for mortgages and retirement planning. FinTrack is built for the chaos of college life—managing part-time job income, textbook costs, late-night pizza runs, and saving for goals that actually matter to you right now.
                    </p>
                    <ul className="grid gap-2 py-4">
                        <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary"/>Stop living paycheck to paycheck.</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary"/>Finally understand where your money goes.</li>
                        <li className="flex items-center gap-2"><ArrowRight className="w-4 h-4 text-primary"/>Build credit and savings habits that will impress your future self.</li>
                    </ul>
                </div>
                <div className="flex justify-center">
                    <Image
                        src="https://picsum.photos/600/600"
                        alt="A confident student using FinTrack on their phone"
                        width={600}
                        height={600}
                        className="rounded-xl shadow-2xl"
                        data-ai-hint="student phone"
                    />
                </div>
            </div>
        </section>


        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                     <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Don't Just Take Our Word For It</h2>
                        <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                           See what other students are saying about their financial glow-up.
                        </p>
                    </div>
                </div>
                 <Suspense fallback={<TestimonialSkeleton />}>
                    <Testimonials />
                </Suspense>
            </div>
        </section>

        <section id="contact" className="w-full py-12 md:py-24 lg:py-32">
            <div className="container grid items-center gap-8 px-4 md:px-6 lg:grid-cols-2 lg:gap-16">
                 <div className="space-y-4">
                    <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary">Contact Us</div>
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Get in Touch</h2>
                    <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Have a question, feedback, or a success story to share? We'd love to hear from you. Drop us a line and our team will get back to you as soon as possible.
                    </p>
                </div>
                <ContactForm />
            </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 border-t">
            <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Ready to Take Control?</h2>
                    <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                        Your future self will thank you. Sign up in minutes and start your journey to financial freedom today.
                    </p>
                </div>
                <div className="mx-auto w-full max-w-sm space-y-2">
                     <Button size="lg" className="w-full" asChild>
                        <Link href="/register">Sign Up For Free</Link>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        Free forever. No credit card required.
                    </p>
                </div>
            </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 FinTrack. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}

function TestimonialSkeleton() {
    return (
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-1 lg:gap-12">
            <Card className="shadow-lg">
                <CardContent className="p-8 space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="w-full space-y-2">
                            <Skeleton className="h-4 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
