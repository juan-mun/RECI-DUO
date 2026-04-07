import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, MapPin, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Solicitud {
  id: string;
  user_id: string;
  direccion_recoleccion: string;
  fecha_preferida: string;
  rango_horario_inicio: string;
  rango_horario_fin: string;
  instrucciones_especiales: string | null;
  notas_acceso: string | null;
  status: string;
  created_at: string;
  generadora_nombre?: string;
  residuos_count?: number;
  ofertas_count?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  publicada: { label: 'Publicada', color: 'hsl(210, 70%, 45%)', bg: 'hsl(210, 70%, 94%)' },
  con_ofertas: { label: 'Con ofertas', color: 'hsl(270, 50%, 45%)', bg: 'hsl(270, 50%, 94%)' },
  aceptada: { label: 'Aceptada', color: 'hsl(145, 50%, 35%)', bg: 'hsl(145, 50%, 94%)' },
  en_proceso: { label: 'En proceso', color: 'hsl(40, 70%, 40%)', bg: 'hsl(40, 70%, 94%)' },
  en_camino: { label: 'En camino', color: 'hsl(30, 70%, 45%)', bg: 'hsl(30, 70%, 94%)' },
  completada: { label: 'Completada', color: 'hsl(145, 60%, 30%)', bg: 'hsl(145, 60%, 92%)' },
  cancelada: { label: 'Cancelada', color: 'hsl(0, 70%, 45%)', bg: 'hsl(0, 70%, 94%)' },
};

export default function AdminTodasSolicitudes() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSolicitudes();
  }, [statusFilter, search]);

  const fetchSolicitudes = async () => {
    setLoading(true);
    let query = supabase
      .from('solicitudes_recoleccion')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter !== 'todas') query = query.eq('status', statusFilter);
    if (search) query = query.ilike('direccion_recoleccion', `%${search}%`);

    const { data } = await query;
    if (!data) { setLoading(false); return; }

    // Get generadora names from profiles
    const userIds = [...new Set(data.map(s => s.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, razon_social')
      .in('user_id', userIds);

    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = p.razon_social; });

    // Get residuos counts
    const solIds = data.map(s => s.id);
    const { data: srData } = await supabase
      .from('solicitud_residuos')
      .select('solicitud_id')
      .in('solicitud_id', solIds);

    const resCounts: Record<string, number> = {};
    srData?.forEach(sr => { resCounts[sr.solicitud_id] = (resCounts[sr.solicitud_id] || 0) + 1; });

    // Get ofertas counts
    const { data: ofData } = await supabase
      .from('ofertas_recoleccion')
      .select('solicitud_id')
      .in('solicitud_id', solIds);

    const ofCounts: Record<string, number> = {};
    ofData?.forEach(o => { ofCounts[o.solicitud_id] = (ofCounts[o.solicitud_id] || 0) + 1; });

    setSolicitudes(data.map(s => ({
      ...s,
      generadora_nombre: profileMap[s.user_id] || 'Sin perfil',
      residuos_count: resCounts[s.id] || 0,
      ofertas_count: ofCounts[s.id] || 0,
    })));
    setLoading(false);
  };

  const statusTabs = [
    { key: 'todas', label: 'Todas' },
    { key: 'publicada', label: 'Publicadas' },
    { key: 'con_ofertas', label: 'Con ofertas' },
    { key: 'aceptada', label: 'Aceptadas' },
    { key: 'en_proceso', label: 'En proceso' },
    { key: 'completada', label: 'Completadas' },
    { key: 'cancelada', label: 'Canceladas' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
          Todas las solicitudes de recolección
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Vista global de todas las solicitudes publicadas en la plataforma</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1 flex-wrap">
          {statusTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por dirección..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Generadora</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dirección</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Horario</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Residuos</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Ofertas</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Cargando...</td></tr>
              ) : solicitudes.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay solicitudes</td></tr>
              ) : solicitudes.map((s, i) => {
                const st = STATUS_CONFIG[s.status] || STATUS_CONFIG.publicada;
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--hero-headline))' }}>{s.generadora_nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[200px] truncate">{s.direccion_recoleccion}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {format(new Date(s.fecha_preferida), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {s.rango_horario_inicio?.slice(0,5)} - {s.rango_horario_fin?.slice(0,5)}
                    </td>
                    <td className="px-4 py-3 text-center">{s.residuos_count}</td>
                    <td className="px-4 py-3 text-center">{s.ofertas_count}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
