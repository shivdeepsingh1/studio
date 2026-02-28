
"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutGrid,
  ClipboardList,
  CalendarOff,
  Users,
  User,
  LogOut,
  BookCheck,
  FileText,
  UserX,
  ClipboardCheck,
  ShieldHalf,
  CalendarCheck2,
} from 'lucide-react';
import { SidebarLogo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/i18n/language-provider';
import { LanguageSwitcher } from '@/components/language-switcher';

function MainSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: t.sidebar.dashboard, icon: LayoutGrid },
    { href: '/duty', label: t.sidebar.duty, icon: ClipboardList },
    { href: '/leave', label: t.sidebar.leave, icon: CalendarOff },
    { href: '/employees', label: t.sidebar.employees, icon: Users, adminOnly: true },
    { href: '/absent-employees', label: t.sidebar.absentEmployees, icon: UserX, adminOnly: true },
    { href: '/duty-report', label: t.sidebar.dutyReport, icon: BookCheck, adminOnly: true },
    { href: '/statement', label: t.sidebar.statement, icon: FileText, adminOnly: true },
    { href: '/today-on-duty', label: t.sidebar.todayOnDuty, icon: ClipboardCheck, adminOnly: true },
    { href: '/today-on-leave', label: t.sidebar.todayOnLeave, icon: CalendarCheck2, adminOnly: true },
    { href: '/today-reserve', label: t.sidebar.todayReserve, icon: ShieldHalf, adminOnly: true },
    { href: '/profile', label: t.sidebar.profile, icon: User },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center justify-between">
            <SidebarLogo />
            {!isMobile && <SidebarTrigger />}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {navItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') {
              return null;
            }
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 p-2 rounded-lg bg-sidebar-accent/20">
            <Avatar>
                <AvatarImage src={user?.avatarUrl} alt={user?.name} data-ai-hint="person portrait" />
                <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-semibold truncate">{user?.name}</span>
                <span className="text-xs text-sidebar-foreground/70">{user?.pno}</span>
            </div>
            <div className="ml-auto flex items-center">
              <LanguageSwitcher />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
              </Button>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg font-semibold">{t.loading}</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-full w-full">
        <MainSidebar />
        <SidebarInset>
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:hidden">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">LineCommand</h1>
            </header>
            <main className="p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
