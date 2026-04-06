import { Button } from '@/components/ui/button';
import { ArrowLeft, Factory, Truck } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RoleSelectionProps {
  onSelect: (role: AppRole) => void;
  onBack: () => void;
}

const roles = [
  {
    id: 'generadora' as AppRole,
    icon: Factory,
    title: 'Empresa Generadora',
    description: 'Empresa que genera residuos y necesita gestionarlos de forma legal y certificada.',
    accent: 'hsl(var(--hero-green))',
    accentBg: 'hsl(var(--eco-light))',
    note: null,
  },
  {
    id: 'recolectora' as AppRole,
    icon: Truck,
    title: 'Empresa Recolectora',
    description: 'Empresa certificada para recolectar, transportar y disponer residuos peligrosos y especiales.',
    accent: 'hsl(40, 70%, 50%)',
    accentBg: 'hsl(40, 70%, 96%)',
    note: null,
  },
];

export function RoleSelection({ onSelect, onBack }: RoleSelectionProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm mb-4 hover:underline"
        style={{ color: 'hsl(var(--hero-muted))' }}
      >
        <ArrowLeft className="h-4 w-4" /> Volver al login
      </button>

      <h1 className="font-headline text-2xl font-bold mb-2" style={{ color: 'hsl(var(--hero-headline))' }}>
        Selecciona tu rol
      </h1>
      <p className="text-sm mb-6" style={{ color: 'hsl(var(--hero-muted))' }}>
        Elige el tipo de cuenta que deseas crear
      </p>

      <div className="space-y-4">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="w-full text-left bg-card rounded-xl border border-border p-5 transition-all hover:shadow-card hover:border-transparent group"
            style={{ '--role-accent': r.accent } as React.CSSProperties}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: r.accentBg }}
              >
                <r.icon className="h-6 w-6" style={{ color: r.accent }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-lg font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
                  {r.title}
                </h3>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--hero-muted))' }}>
                  {r.description}
                </p>
                {r.note && (
                  <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full" style={{ background: r.accentBg, color: r.accent }}>
                    {r.note}
                  </span>
                )}
              </div>
              <ArrowLeft className="h-5 w-5 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" style={{ color: r.accent }} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
