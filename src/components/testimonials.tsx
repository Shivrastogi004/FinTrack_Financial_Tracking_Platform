
'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Testimonial } from '@/types';
import { useEffect, useState } from 'react';
import { Skeleton } from './ui/skeleton';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTestimonials() {
        try {
            const testimonialsRef = collection(db, 'testimonials');
            const q = query(testimonialsRef, orderBy('createdAt', 'desc'), limit(3));
            const querySnapshot = await getDocs(q);
            
            const fetchedTestimonials: Testimonial[] = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                fetchedTestimonials.push({
                    id: doc.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    message: data.message,
                    createdAt: data.createdAt.toDate().toISOString(),
                });
            });
            setTestimonials(fetchedTestimonials);
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            // Fallback to default testimonial on error
            setTestimonials([]); 
        } finally {
            setIsLoading(false);
        }
    }
    fetchTestimonials();
  }, []);

  if (isLoading) {
      return <TestimonialSkeleton />;
  }

  if (testimonials.length === 0) {
      return (
           <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-1 lg:gap-12">
               <Card className="shadow-lg">
                   <CardContent className="p-8 space-y-4">
                       <p className="text-lg font-medium leading-relaxed">"FinTrack completely changed how I handle my money. I went from constantly being broke a week before my next paycheck to actually having savings. The AI import is magic—I just screenshotted my bank app and it did the rest. 10/10 would recommend."</p>
                       <div className="flex items-center gap-4">
                            <div className="rounded-full w-12 h-12 bg-primary/20 flex items-center justify-center font-bold text-primary">
                                JM
                            </div>
                            <div>
                               <p className="font-semibold">Jessica M.</p>
                               <p className="text-sm text-muted-foreground">3rd Year, Computer Science</p>
                            </div>
                       </div>
                   </CardContent>
               </Card>
            </div>
      )
  }

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-1 lg:gap-12">
        {testimonials.map((testimonial) => (
             <Card key={testimonial.id} className="shadow-lg">
                <CardContent className="p-8 space-y-4">
                    <p className="text-lg font-medium leading-relaxed">"{testimonial.message}"</p>
                    <div className="flex items-center gap-4">
                        <div className="rounded-full w-12 h-12 bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {testimonial.firstName[0]}{testimonial.lastName[0]}
                        </div>
                        <div>
                           <p className="font-semibold">{testimonial.firstName} {testimonial.lastName[0]}.</p>
                           <p className="text-sm text-muted-foreground">FinTrack User</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        ))}
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
