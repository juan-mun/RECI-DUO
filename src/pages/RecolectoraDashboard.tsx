import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Truck, Award, TrendingUp, MapPin, Calendar, Package, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export default function RecolectoraDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  // Licencia info from registration_requests
  const { data: licenciaInfo } = useQuery({
    queryKey: ['licencia-info', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('registration_requests')
        .select('numero_resolucion_licencia, autoridad_ambiental, status')
        .eq('user_id', user!.id)
        .eq('role', 'recolectora')
        .eq('status', 'aprobada')
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const today = format(now, 'yyyy-MM-dd');

  // Solicitudes disponibles hoy
  const { data: solicitudesHoy = [] } = useQuery({
    queryKey: ['solicitudes-disponibles-hoy'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes_recoleccion')
        .select('id')
        .in('status', ['publicada', 'con_ofertas']);
      if (error) throw error;
      return data;
    },
  });

  // Ofertas enviadas este mes
  const { data: ofertasMes = [] } = useQuery({
    queryKey: ['ofertas-mes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_recoleccion')
        .select('id, status')
        .eq('recolectora_id', user!.id)
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Recolecciones completadas este mes (ofertas aceptadas)
  const { data: recoleccionesMes = [] } = useQuery({
    queryKey: ['recolecciones-mes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_recoleccion')
        .select('id')
        .eq('recolectora_id', user!.id)
        .eq('status', 'aceptada')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Certificados emitidos totales
  const { data: certificadosTotal = [] } = useQuery({
    queryKey: ['certificados-total-recolectora', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificados')
        .select('id')
        .eq('recolectora_id', user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Próximas recolecciones (ofertas aceptadas con fecha futura)
  const { data: proximasRecolecciones = [] } = useQuery({
    queryKey: ['proximas-recolecciones', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_recoleccion')
        .select('*, solicitudes_recoleccion:solicitud_id(*, solicitud_residuos(*, residuos(nombre, categoria, unidad)))')
        .eq('recolectora_id', user!.id)
        .eq('status', 'aceptada')
        .gte('fecha_disponible', today)
        .order('fecha_disponible', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Solicitudes recientes
  const { data: solicitudesRecientes = [] } = useQuery({
    queryKey: ['solicitudes-recientes-dash'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes_recoleccion')
        .select('*, solicitud_residuos(*, residuos(nombre, categoria, unidad))')
        .in('status', ['publicada', 'con_ofertas'])
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const stats = [
    { title: 'Solicitudes Disponibles', value: solicitudesHoy.length, icon: FileText, color: 'hsl(210, 70%, 50%)' },
    { title: 'Ofertas Este Mes', value: ofertasMes.length, icon: TrendingUp, color: 'hsl(30, 70%, 50%)' },
    { title: 'Recolecciones del Mes', value: recoleccionesMes.length, icon: Truck, color: 'hsl(var(--hero-green))' },
    { title: 'Certificados Totales', value: certificadosTotal.length, icon: Award, color: 'hsl(270, 50%, 50%)' },
  ];

  // Simulated license expiry (30 days from registration approval) — in production this would be a real field
  const licenciaVigente = !!licenciaInfo;
  const licenciaVenceProximamente = false; // would calculate from real expiry date

  const categoriaColors: Record<string, string> = {
    'Peligroso RESPEL': 'bg-red-100 text-red-800',
    'RCD': 'bg-orange-100 text-orange-800',
    'RAEE': 'bg-blue-100 text-blue-800',
    'Hospitalario': 'bg-pink-100 text-pink-800',
    'Orgánico': 'bg-green-100 text-green-800',
    'Especial': 'bg-purple-100 text-purple-800',
  };

  return (
    <div className="p-6 space-y-6">
      {/* License Banner */}
      {licenciaVigente && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
          licenciaVenceProximamente
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          {licenciaVenceProximamente ? (
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          ) : (
            <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
          )}
          <div className="text-sm font-medium">
            {licenciaVenceProximamente
              ? `Licencia próxima a vencer — Renueva antes del vencimiento.`
              : `Licencia activa ✓ — Resolución: ${licenciaInfo.numero_resolucion_licencia || 'N/A'} · Autoridad: ${licenciaInfo.autoridad_ambiental || 'N/A'}`
            }
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-bold">
          Bienvenido{profile ? `, ${profile.razon_social}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Panel de gestión de recolección de residuos.
        </p>
      </div>

      {/* Stats */}
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

      {/* Próximas recolecciones */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Próximas Recolecciones</CardTitle>
          <button
            onClick={() => navigate('/recolectora/recolecciones')}
            className="text-sm text-primary hover:underline"
          >
            Ver todas →
          </button>
        </CardHeader>
        <CardContent>
          {proximasRecolecciones.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No tienes recolecciones programadas próximamente.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {proximasRecolecciones.map((oferta: any) => {
                const sol = oferta.solicitudes_recoleccion;
                return (
                  <div key={oferta.id} className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(oferta.fecha_disponible), "d 'de' MMMM, yyyy", { locale: es })}
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{sol?.direccion_recoleccion}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sol?.solicitud_residuos?.slice(0, 2).map((sr: any) => (
                        <span
                          key={sr.id}
                          className={`text-xs px-2 py-0.5 rounded-full ${categoriaColors[sr.residuos?.categoria] || 'bg-muted text-muted-foreground'}`}
                        >
                          {sr.residuos?.nombre}
                        </span>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-1"
                      onClick={() => navigate('/recolectora/recolecciones')}
                    >
                      Ver detalle
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Solicitudes recientes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Solicitudes Recientes</CardTitle>
          <button
            onClick={() => navigate('/recolectora/solicitudes')}
            className="text-sm text-primary hover:underline"
          >
            Ver todas →
          </button>
        </CardHeader>
        <CardContent>
          {solicitudesRecientes.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6">No hay solicitudes disponibles en este momento.</p>
          ) : (
            <div className="space-y-3">
              {solicitudesRecientes.map((sol: any) => (
                <div key={sol.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm truncate">{sol.direccion_recoleccion}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(sol.fecha_preferida), "d MMM yyyy", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {sol.solicitud_residuos?.length || 0} residuo(s)
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-2 shrink-0">
                    {sol.status === 'publicada' ? 'Nueva' : 'Con ofertas'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
