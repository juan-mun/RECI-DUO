import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RoleSelection } from '@/components/auth/RoleSelection';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { RegistrationSuccess } from '@/components/auth/RegistrationSuccess';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];
type AuthView = 'login' | 'role-select' | 'register' | 'success';

export default function Auth() {
  const { user, role } = useAuth();
  const [view, setView] = useState<AuthView>('login');
  const [selectedRole, setSelectedRole] = useState<AppRole | null>(null);

  if (user && role === 'admin') return <Navigate to="/admin/solicitudes" replace />;
  if (user && role === 'generadora') return <Navigate to="/generadora" replace />;
  if (user && role === 'recolectora') return <Navigate to="/recolectora" replace />;
  if (user && role) return <Navigate to="/" replace />;

  const handleRoleSelect = (r: AppRole) => {
    setSelectedRole(r);
    setView('register');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: 'hsl(var(--hero-bg))' }}>
      <Link
        to="/"
        className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-sm font-medium hover:opacity-70 transition-opacity"
        style={{ color: 'hsl(var(--hero-muted))' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>
      <div className="w-full max-w-xl animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--hero-green))' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(0,0%,100%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M7 12l3 3 7-7"/>
              </svg>
            </div>
            <span className="font-headline text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>RECI-DUO</span>
          </div>
          <p className="text-sm" style={{ color: 'hsl(var(--hero-muted))' }}>
            Gestión inteligente de residuos
          </p>
        </div>

        {view === 'login' && (
          <LoginForm onSwitchToRegister={() => setView('role-select')} />
        )}
        {view === 'role-select' && (
          <RoleSelection
            onSelect={handleRoleSelect}
            onBack={() => setView('login')}
          />
        )}
        {view === 'register' && selectedRole && (
          <RegisterForm
            role={selectedRole}
            onBack={() => setView('role-select')}
            onSuccess={() => setView('success')}
          />
        )}
        {view === 'success' && (
          <RegistrationSuccess onBackToLogin={() => setView('login')} />
        )}
      </div>
    </div>
  );
}
