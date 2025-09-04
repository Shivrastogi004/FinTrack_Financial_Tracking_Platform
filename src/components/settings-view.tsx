
'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/context/app-context';
import type { Profile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  college: z.string().min(1, 'College name is required'),
  degree: z.string().min(1, 'Degree name is required'),
  graduationYear: z.coerce.number().min(new Date().getFullYear(), 'Year must be in the future'),
});

export default function SettingsView() {
  const { profile, updateProfile } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    setIsSubmitting(true);
    updateProfile(data);
    setTimeout(() => {
        toast({
            title: 'Profile Updated',
            description: 'Your information has been saved successfully.',
        });
        setIsSubmitting(false);
    }, 500);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and application settings.</p>
      </div>

      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>This information helps personalize your experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Alex" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Robinson" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </div>

               <FormField
                    control={form.control}
                    name="college"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>College / University</FormLabel>
                        <FormControl>
                            <Input placeholder="State University" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="degree"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Degree Program</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="graduationYear"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Expected Graduation Year</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="2026" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
              </div>


            </CardContent>
            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
