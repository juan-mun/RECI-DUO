import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface Props {
  onBackToLogin: () => void;
}

export function RegistrationSuccess({ onBackToLogin }: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-8 border border-border text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center animate-fade-up" style={{ background: 'hsl(var(--eco-light))' }}>
        <CheckCircle className="h-10 w-10" style={{ color: 'hsl(var(--hero-green))' }} />
      </div>
      <h2 className="font-headline text-xl font-bold mb-3" style={{ color: 'hsl(var(--hero-headline))' }}>
        ¡Solicitud enviada!
      </h2>
      <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'hsl(var(--hero-muted))' }}>
        Tu solicitud ha sido enviada. Un administrador revisará tus documentos y recibirás una respuesta en tu correo en un plazo de 1 a 3 días hábiles.
      </p>
      <Button
        onClick={onBackToLogin}
        className="rounded-[50px] h-11 px-8"
        style={{ background: 'hsl(var(--hero-headline))' }}
      >
        Volver al login
      </Button>
    </div>
  );
}
