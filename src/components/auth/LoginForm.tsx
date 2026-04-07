import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: 'Correo o contraseña incorrectos.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border">
      <h1 className="font-headline text-2xl font-bold text-center mb-6" style={{ color: 'hsl(var(--hero-headline))' }}>
        Iniciar sesión
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'hsl(var(--hero-subtitle))' }}>
            Correo electrónico
          </label>
          <Input
            type="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block" style={{ color: 'hsl(var(--hero-subtitle))' }}>
            Contraseña
          </label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <button type="button" className="text-sm text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <Button type="submit" disabled={loading} className="w-full rounded-[50px] h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200" style={{ background: 'hsl(var(--hero-green))', color: 'hsl(0,0%,100%)' }}>
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <>
              <LogIn className="h-5 w-5 mr-2" />
              Ingresar
            </>
          )}
        </Button>
      </form>

      <div className="mt-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">¿No tienes cuenta?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <Button
        variant="outline"
        onClick={onSwitchToRegister}
        className="w-full mt-4 rounded-[50px] h-11"
        style={{ borderColor: 'hsl(var(--hero-border-soft))', color: 'hsl(var(--hero-subtitle))' }}
      >
        Regístrate
      </Button>
    </div>
  );
}
