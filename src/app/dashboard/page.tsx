
'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AppProvider, useAppContext } from '@/context/app-context';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarContent, SidebarInset, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Logo from '@/components/icons/logo';
import { LayoutDashboard, Receipt, Target, Goal, PanelLeft, Settings, LifeBuoy, LogOut, Trophy, Repeat, Lightbulb } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { isToday, isYesterday } from 'date-fns';

const DashboardView = dynamic(() => import('@/components/dashboard-view'));
const TransactionsView = dynamic(() => import('@/components/transactions-view'));
const BudgetsView = dynamic(() => import('@/components/budgets-view'));
const GoalsView = dynamic(() => import('@/components/goals-view'));
const AchievementsView = dynamic(() => import('@/components/achievements-view'));
const RecurringView = dynamic(() => import('@/components/recurring-view'));
const AdviceView = dynamic(() => import('@/components/advice-view'));
const HelpView = dynamic(() => import('@/components/help-view'));
const SettingsView = dynamic(() => import('@/components/settings-view'));


export type View = 'dashboard' | 'transactions' | 'budgets' | 'goals' | 'achievements' | 'recurring' | 'advice' | 'settings' | 'help';

const viewConfig = {
  dashboard: { title: 'Dashboard', icon: LayoutDashboard, component: DashboardView },
  transactions: { title: 'Transactions', icon: Receipt, component: TransactionsView },
  budgets: { title: 'Budgets', icon: Target, component: BudgetsView },
  goals: { title: 'Goals', icon: Goal, component: GoalsView },
  achievements: { title: 'Achievements', icon: Trophy, component: AchievementsView },
  recurring: { title: 'Recurring', icon: Repeat, component: RecurringView },
  advice: { title: 'Advice', icon: Lightbulb, component: AdviceView },
  settings: { title: 'Settings', icon: Settings, component: SettingsView },
  help: { title: 'Help', icon: LifeBuoy, component: HelpView },
};


function AppContent() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, loading, isNewUser } = useAuth();
  const { lastLoginDate, setLastLoginDate, dailyStreak, setDailyStreak, profile, isDataLoading } = useAppContext();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || loading) return;

    if (!user) {
      router.push('/');
    } else if (isNewUser) {
        router.push('/dashboard?view=settings');
        // The view state will be updated by the next effect
    }
  }, [user, loading, isNewUser, router, isMounted]);
  
  useEffect(() => {
    if (!isMounted || isDataLoading || loading || !user) return;

    const today = new Date();
    const lastLogin = lastLoginDate ? new Date(lastLoginDate) : new Date(0); // Handle undefined lastLoginDate

    if (!isToday(lastLogin)) {
      if (isYesterday(lastLogin)) {
        setDailyStreak(dailyStreak + 1);
      } else {
        setDailyStreak(1);
      }
      setLastLoginDate(today.toISOString().split('T')[0]);
    }
  }, [isMounted, dailyStreak, lastLoginDate, setDailyStreak, setLastLoginDate, isDataLoading, loading, user]);

  useEffect(() => {
    if (!isMounted) return;
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get('view') as View;
    if (view && viewConfig[view]) {
      setActiveView(view);
    }
  }, [isMounted]);

  if (!isMounted || loading || isDataLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }
  
  const ActiveComponent = viewConfig[activeView].component;

  const navigateTo = (view: View) => {
    setActiveView(view);
    setMobileMenuOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.pushState({}, '', url);
  };

  const NavContent = () => (
    <SidebarMenu>
      {Object.keys(viewConfig).map((key) => {
        if (key === 'help' || key === 'settings') return null; // Don't show help/settings in the main nav list
        const view = key as View;
        const Icon = viewConfig[view].icon;
        return (
          <SidebarMenuItem key={view}>
            <SidebarMenuButton
              onClick={() => navigateTo(view)}
              isActive={activeView === view}
              tooltip={{ children: viewConfig[view].title }}
            >
              <Icon />
              <span>{viewConfig[view].title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <SidebarProvider>
       <div className="md:hidden p-2 flex justify-between items-center bg-card border-b sticky top-0 z-20 bg-background/95 backdrop-blur-sm">
         <div className="flex items-center gap-2">
            <Logo />
            <h1 className="text-lg font-bold">FinTrack</h1>
          </div>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <PanelLeft />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar text-sidebar-foreground">
            <SidebarHeader className="p-2 border-b">
               <div className="flex items-center gap-2 text-sidebar-foreground p-2">
                    <Logo />
                    <span className="text-lg font-bold">FinTrack</span>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-0">
                <NavContent />
            </SidebarContent>
             <SidebarFooter className="p-2 border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigateTo('settings')}>
                            <Settings />
                            <span>Settings</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => navigateTo('help')}>
                            <LifeBuoy />
                            <span>Help</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={logout}>
                            <LogOut />
                            <span>Log Out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
             </SidebarFooter>
          </SheetContent>
        </Sheet>
      </div>

      <Sidebar>
        <SidebarHeader className="border-b">
          <div className="flex items-center gap-2 text-sidebar-foreground p-2">
            <Logo />
            <span className="text-lg font-bold group-data-[collapsible=icon]:hidden">FinTrack</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-0">
          <NavContent />
        </SidebarContent>
        <SidebarFooter className="p-2 border-t">
            <SidebarMenu>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Settings" onClick={() => navigateTo('settings')}>
                        <Settings/>
                        <span>Settings</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Help" onClick={() => navigateTo('help')}>
                        <LifeBuoy/>
                        <span>Help</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Log Out" onClick={logout}>
                        <LogOut/>
                        <span>Log Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
             <div className="flex items-center gap-3 p-3 mt-2 border-t group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-9 w-9">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="@student" data-ai-hint="avatar" />
                    <AvatarFallback>{profile?.firstName?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="grid gap-0.5 text-xs group-data-[collapsible=icon]:hidden">
                    <div className="font-medium text-sidebar-foreground">{profile?.firstName} {profile?.lastName}</div>
                    <div className="text-muted-foreground">{user?.email}</div>
                </div>
            </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 hidden h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:flex">
          <SidebarTrigger />
        </header>
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          <React.Suspense fallback={<div className="flex h-full w-full items-center justify-center">Loading view...</div>}>
            <ActiveComponent />
          </React.Suspense>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


export default function DashboardPage() {
  return (
      <AppProvider>
        <AppContent />
      </AppProvider>
  );
}
