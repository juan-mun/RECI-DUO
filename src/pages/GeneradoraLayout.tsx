import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { GeneradoraSidebar } from '@/components/generadora/GeneradoraSidebar';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GeneradoraLayout() {
  const { user, signOut } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <GeneradoraSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="mr-2" />
              <span className="font-headline text-sm font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
                Panel Empresa Generadora
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </button>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
