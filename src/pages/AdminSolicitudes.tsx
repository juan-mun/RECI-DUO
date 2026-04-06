import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, MoreHorizontal, Filter } from 'lucide-react';
import { SolicitudDetailDrawer } from '@/components/admin/SolicitudDetailDrawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Request {
  id: string;
  razon_social: string;
  nit: string;
  role: 'admin' | 'generadora' | 'recolectora';
  status: string;
  created_at: string;
  email_corporativo: string;
  representante_legal: string;
  telefono: string;
  ciudad: string;
  numero_resolucion_licencia: string | null;
  autoridad_ambiental: string | null;
  user_id: string;
  doc_count?: number;
  total_docs?: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente de revisión', color: 'hsl(40, 70%, 40%)', bg: 'hsl(40, 70%, 94%)' },
  en_revision: { label: 'En revisión', color: 'hsl(210, 70%, 45%)', bg: 'hsl(210, 70%, 94%)' },
  aprobada: { label: 'Aprobada', color: 'hsl(145, 50%, 35%)', bg: 'hsl(145, 50%, 94%)' },
  rechazada: { label: 'Rechazada', color: 'hsl(0, 70%, 45%)', bg: 'hsl(0, 70%, 94%)' },
  correccion: { label: 'Corrección solicitada', color: 'hsl(30, 70%, 45%)', bg: 'hsl(30, 70%, 94%)' },
};

export default function AdminSolicitudes() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('todas');
  const [roleFilter, setRoleFilter] = useState('todas');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase.from('registration_requests').select('*').order('created_at', { ascending: false });

    if (statusFilter !== 'todas') query = query.eq('status', statusFilter);
    if (roleFilter !== 'todas') query = query.eq('role', roleFilter as 'generadora' | 'recolectora');
    if (search) query = query.or(`razon_social.ilike.%${search}%,nit.ilike.%${search}%`);

    const { data } = await query;

    if (data) {
      // Fetch doc counts
      const ids = data.map((r) => r.id);
      const { data: docs } = await supabase
        .from('registration_documents')
        .select('request_id')
        .in('request_id', ids);

      const docCounts: Record<string, number> = {};
      docs?.forEach((d) => {
        docCounts[d.request_id] = (docCounts[d.request_id] || 0) + 1;
      });

      setRequests(
        data.map((r) => ({
          ...r,
          doc_count: docCounts[r.id] || 0,
          total_docs: r.role === 'generadora' ? 5 : 7,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, roleFilter, search]);

  const statusTabs = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'en_revision', label: 'En revisión' },
    { key: 'aprobada', label: 'Aprobadas' },
    { key: 'rechazada', label: 'Rechazadas' },
  ];

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
          Solicitudes de registro
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gestiona las solicitudes de empresas que desean unirse a RECI-DUO</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {statusTabs.map((t) => (
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

        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { key: 'todas', label: 'Todos los roles' },
            { key: 'generadora', label: 'Generadoras' },
            { key: 'recolectora', label: 'Recolectoras' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setRoleFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                roleFilter === t.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar empresa o NIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Empresa</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">NIT</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rol</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Docs</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Cargando...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay solicitudes</td></tr>
              ) : (
                requests.map((r, i) => {
                  const st = STATUS_CONFIG[r.status] || STATUS_CONFIG.pendiente;
                  const docRatio = r.doc_count || 0;
                  const totalDocs = r.total_docs || 5;
                  const docColor = docRatio >= totalDocs ? 'hsl(145,50%,35%)' : docRatio >= totalDocs / 2 ? 'hsl(40,70%,40%)' : 'hsl(0,70%,45%)';

                  return (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'hsl(var(--hero-headline))' }}>{r.razon_social}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{r.nit}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full capitalize" style={{
                          background: r.role === 'generadora' ? 'hsl(145,50%,94%)' : 'hsl(40,70%,94%)',
                          color: r.role === 'generadora' ? 'hsl(145,50%,35%)' : 'hsl(40,70%,40%)',
                        }}>
                          {r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(r.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium" style={{ color: docColor }}>
                          {docRatio}/{totalDocs} {docRatio >= totalDocs ? '✓' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedId(r.id)} className="text-xs gap-1">
                            <Eye className="h-3.5 w-3.5" /> Ver detalle
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(r.id)}>Ver detalle</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selectedId && (
        <SolicitudDetailDrawer
          requestId={selectedId}
          open={!!selectedId}
          onClose={() => { setSelectedId(null); fetchRequests(); }}
        />
      )}
    </div>
  );
}
