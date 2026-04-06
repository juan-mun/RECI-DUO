import { Recycle, FileText, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function GeneradoraDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ razon_social: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('razon_social')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data));
  }, [user]);

  const stats = [
    { title: 'Residuos Registrados', value: '0', icon: Recycle, color: 'hsl(var(--hero-green))' },
    { title: 'Solicitudes Activas', value: '0', icon: FileText, color: 'hsl(210, 70%, 50%)' },
    { title: 'Recolecciones', value: '0', icon: TrendingUp, color: 'hsl(30, 70%, 50%)' },
    { title: 'Certificados', value: '0', icon: CheckCircle, color: 'hsl(270, 50%, 50%)' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold">
          Bienvenido{profile ? `, ${profile.razon_social}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Panel de gestión de residuos de tu empresa.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Próximos pasos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Recycle className="h-5 w-5 mt-0.5" style={{ color: 'hsl(var(--hero-green))' }} />
            <div>
              <p className="font-medium text-sm">Registra tus residuos</p>
              <p className="text-sm text-muted-foreground">Agrega los tipos de residuos que genera tu empresa para conectarte con recolectoras.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <FileText className="h-5 w-5 mt-0.5" style={{ color: 'hsl(210, 70%, 50%)' }} />
            <div>
              <p className="font-medium text-sm">Crea una solicitud de recolección</p>
              <p className="text-sm text-muted-foreground">Solicita la recolección de tus residuos y recibe ofertas de empresas recolectoras certificadas.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
