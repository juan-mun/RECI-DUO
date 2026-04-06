import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, FileText, Truck, Award, Clock, AlertTriangle, ArrowUpRight, Eye, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DashboardData {
  generadorasCount: number;
  recolectorasCount: number;
  solicitudesAbiertas: number;
  solicitudesConOfertas: number;
  solicitudesSinOfertas: number;
  recoleccionesMes: number;
  certificadosTotal: number;
  pendientesAprobar: number;
  recentRequests: { razon_social: string; role: string; created_at: string; status: string }[];
  alertItems: { message: string; severity: string; time: string }[];
}

const severityConfig: Record<string, { label: string; className: string }> = {
  alta: { label: 'Alta', className: 'bg-destructive/10 text-destructive border-destructive/20' },
  media: { label: 'Media', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  baja: { label: 'Baja', className: 'bg-muted text-muted-foreground border-border' },
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user roles counts
        const { data: roles } = await supabase.from('user_roles').select('role');
        const generadorasCount = roles?.filter(r => r.role === 'generadora').length || 0;
        const recolectorasCount = roles?.filter(r => r.role === 'recolectora').length || 0;

        // Fetch open solicitudes
        const { data: solicitudes } = await supabase.from('solicitudes_recoleccion').select('id, status');
        const abiertas = solicitudes?.filter(s => ['publicada', 'con_ofertas'].includes(s.status)) || [];

        // Fetch ofertas to determine which solicitudes have offers
        const { data: ofertas } = await supabase.from('ofertas_recoleccion').select('solicitud_id');
        const solicitudesConOfertasIds = new Set(ofertas?.map(o => o.solicitud_id) || []);
        const conOfertas = abiertas.filter(s => solicitudesConOfertasIds.has(s.id)).length;
        const sinOfertas = abiertas.length - conOfertas;

        // Recolecciones this month (completadas)
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const completadas = solicitudes?.filter(s => s.status === 'completada') || [];
        const recoleccionesMes = completadas.length;

        // Certificados total
        const { count: certCount } = await supabase.from('certificados').select('*', { count: 'exact', head: true });

        // Pending registration requests
        const { data: pendingReqs } = await supabase
          .from('registration_requests')
          .select('razon_social, role, created_at, status')
          .in('status', ['pendiente', 'en_revision'])
          .order('created_at', { ascending: false });

        // Build alerts from real conditions
        const alertItems: { message: string; severity: string; time: string }[] = [];

        // Check for documents about to expire
        const { data: docs } = await supabase
          .from('registration_documents')
          .select('document_name, fecha_vencimiento, request_id, registration_requests(razon_social)')
          .not('fecha_vencimiento', 'is', null);

        if (docs) {
          const today = new Date();
          for (const doc of docs) {
            if (!doc.fecha_vencimiento) continue;
            const venc = new Date(doc.fecha_vencimiento);
            const diffDays = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const empresa = (doc.registration_requests as any)?.razon_social || 'Empresa';
            if (diffDays < 0) {
              alertItems.push({ message: `${doc.document_name} de ${empresa} venció hace ${Math.abs(diffDays)} días`, severity: 'alta', time: `Hace ${Math.abs(diffDays)}d` });
            } else if (diffDays <= 30) {
              alertItems.push({ message: `${doc.document_name} de ${empresa} vence en ${diffDays} días`, severity: 'media', time: 'Próximo a vencer' });
            }
          }
        }

        // Check for pending document reviews
        const { data: pendingDocs } = await supabase
          .from('registration_documents')
          .select('document_name, registration_requests(razon_social)')
          .eq('validation_status', 'pendiente');

        if (pendingDocs && pendingDocs.length > 0) {
          alertItems.push({
            message: `${pendingDocs.length} documento(s) pendiente(s) de revisión`,
            severity: 'baja',
            time: 'Pendiente',
          });
        }

        // If no alerts, add informational
        if (alertItems.length === 0) {
          alertItems.push({ message: 'No hay alertas activas en este momento', severity: 'baja', time: 'Ahora' });
        }

        setData({
          generadorasCount,
          recolectorasCount,
          solicitudesAbiertas: abiertas.length,
          solicitudesConOfertas: conOfertas,
          solicitudesSinOfertas: sinOfertas,
          recoleccionesMes,
          certificadosTotal: certCount || 0,
          pendientesAprobar: pendingReqs?.length || 0,
          recentRequests: pendingReqs || [],
          alertItems,
        });
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const metrics = [
    {
      title: 'Empresas activas',
      value: String(data.generadorasCount + data.recolectorasCount),
      subtitle: `${data.generadorasCount} generadoras · ${data.recolectorasCount} recolectoras`,
      icon: Building2,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Solicitudes abiertas',
      value: String(data.solicitudesAbiertas),
      subtitle: `${data.solicitudesConOfertas} con ofertas · ${data.solicitudesSinOfertas} sin ofertas`,
      icon: FileText,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Recolecciones completadas',
      value: String(data.recoleccionesMes),
      subtitle: 'Solicitudes completadas',
      icon: Truck,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Certificados emitidos',
      value: String(data.certificadosTotal),
      subtitle: 'Total acumulado',
      icon: Award,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Pendientes de aprobar',
      value: String(data.pendientesAprobar),
      subtitle: 'Solicitudes de registro',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      alert: data.pendientesAprobar > 0,
    },
    {
      title: 'Alertas activas',
      value: String(data.alertItems.filter(a => a.severity !== 'baja' || data.alertItems.length === 1).length),
      subtitle: 'Requieren atención',
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
      alert: data.alertItems.some(a => a.severity === 'alta'),
    },
  ];

  const roleLabels: Record<string, string> = { generadora: 'Generadora', recolectora: 'Recolectora' };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen general de la plataforma RECI-DUO.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <Card key={m.title} className={m.alert ? 'border-l-4' : ''} style={m.alert ? { borderLeftColor: m.color === 'text-amber-600' ? 'hsl(45, 93%, 47%)' : 'hsl(var(--destructive))' } : undefined}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium">{m.title}</p>
                  <p className="text-3xl font-headline font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>{m.value}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{m.subtitle}</span>
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg ${m.bgColor}`}>
                  <m.icon className={`h-5 w-5 ${m.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns: Recent requests + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-headline">Solicitudes de registro recientes</CardTitle>
            <CardDescription>Últimas solicitudes pendientes de revisión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentRequests.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay solicitudes pendientes</p>
            )}
            {data.recentRequests.slice(0, 3).map((req, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{req.razon_social}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{roleLabels[req.role] || req.role}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin/solicitudes')} className="text-xs gap-1">
                  <Eye className="h-3.5 w-3.5" /> Ver
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate('/admin/solicitudes')}>
              Ver todas las solicitudes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-headline">Alertas prioritarias</CardTitle>
            <CardDescription>Situaciones que requieren atención</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.alertItems.slice(0, 3).map((alert, i) => {
              const sev = severityConfig[alert.severity] || severityConfig.baja;
              return (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/40 border border-border/50 gap-3">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="text-sm">{alert.message}</p>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] px-1.5 py-0 border ${sev.className}`}>{sev.label}</Badge>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs shrink-0" onClick={() => navigate('/admin/alertas')}>Resolver</Button>
                </div>
              );
            })}
            <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => navigate('/admin/alertas')}>
              Ver todas las alertas
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
