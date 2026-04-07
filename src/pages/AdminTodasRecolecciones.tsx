import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, Truck, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Recoleccion {
  id: string;
  solicitud_id: string;
  recolectora_id: string;
  precio_propuesto: number;
  fecha_disponible: string;
  status: string;
  created_at: string;
  recolectora_nombre?: string;
  generadora_nombre?: string;
  direccion?: string;
  solicitud_status?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  aceptada: { label: 'Confirmada', color: 'hsl(210, 70%, 45%)', bg: 'hsl(210, 70%, 94%)' },
  en_camino: { label: 'En camino', color: 'hsl(30, 70%, 45%)', bg: 'hsl(30, 70%, 94%)' },
  completada: { label: 'Completada', color: 'hsl(145, 60%, 30%)', bg: 'hsl(145, 60%, 92%)' },
  cancelada: { label: 'Cancelada', color: 'hsl(0, 70%, 45%)', bg: 'hsl(0, 70%, 94%)' },
};

export default function AdminTodasRecolecciones() {
  const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todas');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchRecolecciones();
  }, [statusFilter, search]);

  const fetchRecolecciones = async () => {
    setLoading(true);

    // Get accepted ofertas (these are the actual recolecciones)
    let query = supabase
      .from('ofertas_recoleccion')
      .select('*')
      .in('status', ['aceptada', 'en_camino', 'completada', 'cancelada'])
      .order('created_at', { ascending: false });

    if (statusFilter !== 'todas') query = query.eq('status', statusFilter);

    const { data: ofertas } = await query;
    if (!ofertas || ofertas.length === 0) { setRecolecciones([]); setLoading(false); return; }

    // Get recolectora profiles
    const recIds = [...new Set(ofertas.map(o => o.recolectora_id))];
    const { data: recProfiles } = await supabase
      .from('profiles')
      .select('user_id, razon_social')
      .in('user_id', recIds);
    const recMap: Record<string, string> = {};
    recProfiles?.forEach(p => { recMap[p.user_id] = p.razon_social; });

    // Get solicitudes for addresses and generadora info
    const solIds = [...new Set(ofertas.map(o => o.solicitud_id))];
    const { data: solicitudes } = await supabase
      .from('solicitudes_recoleccion')
      .select('id, user_id, direccion_recoleccion, status')
      .in('id', solIds);

    const solMap: Record<string, { user_id: string; direccion: string; status: string }> = {};
    solicitudes?.forEach(s => { solMap[s.id] = { user_id: s.user_id, direccion: s.direccion_recoleccion, status: s.status }; });

    // Get generadora profiles
    const genIds = [...new Set(solicitudes?.map(s => s.user_id) || [])];
    const { data: genProfiles } = await supabase
      .from('profiles')
      .select('user_id, razon_social')
      .in('user_id', genIds);
    const genMap: Record<string, string> = {};
    genProfiles?.forEach(p => { genMap[p.user_id] = p.razon_social; });

    let results = ofertas.map(o => {
      const sol = solMap[o.solicitud_id];
      return {
        ...o,
        recolectora_nombre: recMap[o.recolectora_id] || 'Sin perfil',
        generadora_nombre: sol ? genMap[sol.user_id] || 'Sin perfil' : 'N/A',
        direccion: sol?.direccion || '',
        solicitud_status: sol?.status || '',
      };
    });

    if (search) {
      const q = search.toLowerCase();
      results = results.filter(r =>
        r.recolectora_nombre?.toLowerCase().includes(q) ||
        r.generadora_nombre?.toLowerCase().includes(q) ||
        r.direccion?.toLowerCase().includes(q)
      );
    }

    setRecolecciones(results);
    setLoading(false);
  };

  const statusTabs = [
    { key: 'todas', label: 'Todas' },
    { key: 'aceptada', label: 'Confirmadas' },
    { key: 'en_camino', label: 'En camino' },
    { key: 'completada', label: 'Completadas' },
    { key: 'cancelada', label: 'Canceladas' },
  ];

  const completadas = recolecciones.filter(r => r.status === 'completada').length;
  const activas = recolecciones.filter(r => ['aceptada', 'en_camino'].includes(r.status)).length;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
          Todas las recolecciones
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Seguimiento de todas las recolecciones activas y completadas</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total recolecciones</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>{recolecciones.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4" style={{ color: 'hsl(30, 70%, 45%)' }} />
            <span className="text-xs text-muted-foreground">Activas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(30, 70%, 45%)' }}>{activas}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4" style={{ color: 'hsl(145, 60%, 30%)' }} />
            <span className="text-xs text-muted-foreground">Completadas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(145, 60%, 30%)' }}>{completadas}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
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
          <Input placeholder="Buscar por empresa o dirección..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-72" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Generadora</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recolectora</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Dirección</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Precio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Cargando...</td></tr>
              ) : recolecciones.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No hay recolecciones</td></tr>
              ) : recolecciones.map((r, i) => {
                const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.aceptada;
                return (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-xs" style={{ color: 'hsl(var(--hero-headline))' }}>{r.generadora_nombre}</td>
                    <td className="px-4 py-3 font-medium text-xs">{r.recolectora_nombre}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{r.direccion}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(r.fecha_disponible), 'dd MMM yyyy', { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">${Number(r.precio_propuesto).toLocaleString()}</td>
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
