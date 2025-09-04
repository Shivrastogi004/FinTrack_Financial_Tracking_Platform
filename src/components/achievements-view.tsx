
'use client';

import React, { useEffect } from 'react';
import { useAppContext } from '@/context/app-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Flame, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AchievementsView() {
  const { dailyStreak, achievements, unlockAchievement } = useAppContext();

  useEffect(() => {
    if (dailyStreak >= 3) {
      unlockAchievement('on-a-roll-3');
    }
    if (dailyStreak >= 7) {
      unlockAchievement('weekly-warrior-7');
    }
  }, [dailyStreak, unlockAchievement]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Track your progress and unlock rewards for good financial habits.</p>
      </div>

      <Card className="bg-primary/10 border-primary/20 text-center">
        <CardHeader>
          <div className="mx-auto bg-background/50 rounded-full h-16 w-16 flex items-center justify-center border-2 border-primary">
            <Flame className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl mt-4">Daily Login Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-6xl font-bold text-primary">{dailyStreak}</p>
          <p className="text-muted-foreground">{dailyStreak === 1 ? 'Day' : 'Days'} in a row!</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Your Medals</CardTitle>
          <CardDescription>Keep up the great work to collect them all.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach) => (
            <Card
              key={ach.id}
              className={cn(
                "p-4 flex items-center gap-4 transition-all",
                ach.achieved ? "bg-accent border-primary/50" : "bg-card"
              )}
            >
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                   ach.achieved ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {ach.achieved ? <Trophy /> : <Trophy className="opacity-50" />}
              </div>
              <div className="flex-grow">
                <p className="font-semibold">{ach.name}</p>
                <p className="text-sm text-muted-foreground">{ach.description}</p>
              </div>
              {ach.achieved && (
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
              )}
            </Card>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
