import { useState, useEffect, useMemo } from 'react';
import { Truck, Search, Download, FileText, ClipboardList, Ban, CheckCircle, Mail, AlertTriangle, Bell, Shield, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Recolectora {
  id: string;
  user_id: string;
  razon_social: string;
  nit: string;
  ciudad: string;
  representante_legal: string;
  email_corporativo: string;
  telefono: string;
  created_at: string;
  solicitudes_activas: number;
  certificados_totales: number;
  estado: 'activa' | 'suspendida' | 'inactiva';
  licencia: {
    numero_resolucion: string;
    autoridad: string;
    fecha_vencimiento: string;
    estado: 'vigente' | 'por_vencer' | 'vencida' | 'sin_licencia';
    categorias_autorizadas: string[];
  };
  documentos: { nombre: string; estado: string; fecha: string }[];
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  activa: { label: 'Activa', className: 'bg-primary/15 text-primary border-primary/30' },
  suspendida: { label: 'Suspendida', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  inactiva: { label: 'Inactiva', className: 'bg-muted text-muted-foreground border-border' },
};

const licenciaConfig: Record<string, { label: string; dotClass: string }> = {
  vigente: { label: 'Vigente', dotClass: 'bg-primary' },
  por_vencer: { label: 'Por vencer', dotClass: 'bg-amber-500' },
  vencida: { label: 'Vencida', dotClass: 'bg-destructive' },
  sin_licencia: { label: 'Sin datos', dotClass: 'bg-muted-foreground' },
};

const docEstadoConfig: Record<string, string> = {
  Vigente: 'text-primary',
  'Por vencer': 'text-amber-600',
  Vencido: 'text-destructive',
  Pendiente: 'text-muted-foreground',
};

function getDocStatus(validationStatus: string | null, fechaVencimiento: string | null): string {
  if (validationStatus === 'pendiente') return 'Pendiente';
  if (!fechaVencimiento) return validationStatus === 'valido' ? 'Vigente' : 'Pendiente';
  const today = new Date();
  const venc = new Date(fechaVencimiento);
  const diffDays = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Vencido';
  if (diffDays <= 30) return 'Por vencer';
  return 'Vigente';
}

function getLicenciaEstado(fechaVencimiento: string | null): 'vigente' | 'por_vencer' | 'vencida' | 'sin_licencia' {
  if (!fechaVencimiento) return 'sin_licencia';
  const today = new Date();
  const venc = new Date(fechaVencimiento);
  const diffDays = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'vencida';
  if (diffDays <= 30) return 'por_vencer';
  return 'vigente';
}

export default function AdminRecolectoras() {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCiudad, setFilterCiudad] = useState('todas');
  const [selected, setSelected] = useState<Recolectora | null>(null);
  const [recolectoras, setRecolectoras] = useState<Recolectora[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'recolectora');
        if (!roles || roles.length === 0) { setLoading(false); return; }
        const userIds = roles.map(r => r.user_id);

        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);
        const { data: ofertas } = await supabase.from('ofertas_recoleccion').select('recolectora_id, status');
        const { data: certificados } = await supabase.from('certificados').select('recolectora_id');
        const { data: requests } = await supabase.from('registration_requests').select('id, user_id, numero_resolucion_licencia, autoridad_ambiental').in('user_id', userIds);

        const requestIds = requests?.map(r => r.id) || [];
        const { data: docs } = await supabase.from('registration_documents').select('*').in('request_id', requestIds);

        const result: Recolectora[] = (profiles || []).map(p => {
          const ofertasActivas = ofertas?.filter(o => o.recolectora_id === p.user_id && o.status === 'pendiente').length || 0;
          const certsTotal = certificados?.filter(c => c.recolectora_id === p.user_id).length || 0;
          const req = requests?.find(r => r.user_id === p.user_id);
          const empresaDocs = docs?.filter(d => d.request_id === req?.id) || [];

          // Find licencia document
          const licenciaDoc = empresaDocs.find(d => d.document_name.toLowerCase().includes('licencia'));
          const licenciaEstado = getLicenciaEstado(licenciaDoc?.fecha_vencimiento || null);

          return {
            id: p.id,
            user_id: p.user_id,
            razon_social: p.razon_social,
            nit: p.nit,
            ciudad: p.ciudad,
            representante_legal: p.representante_legal,
            email_corporativo: p.email_corporativo,
            telefono: p.telefono,
            created_at: p.created_at,
            solicitudes_activas: ofertasActivas,
            certificados_totales: certsTotal,
            estado: licenciaEstado === 'vencida' ? 'suspendida' as const : 'activa' as const,
            licencia: {
              numero_resolucion: req?.numero_resolucion_licencia || 'No registrada',
              autoridad: req?.autoridad_ambiental || 'No registrada',
              fecha_vencimiento: licenciaDoc?.fecha_vencimiento || '',
              estado: licenciaEstado,
              categorias_autorizadas: licenciaDoc?.categorias_autorizadas || [],
            },
            documentos: empresaDocs.map(d => ({
              nombre: d.document_name,
              estado: getDocStatus(d.validation_status, d.fecha_vencimiento),
              fecha: d.fecha_vencimiento || 'Sin fecha',
            })),
          };
        });

        setRecolectoras(result);
      } catch (err) {
        console.error('Error fetching recolectoras:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const ciudades = useMemo(() => [...new Set(recolectoras.map(r => r.ciudad))], [recolectoras]);
  const porVencer = recolectoras.filter(r => r.licencia.estado === 'por_vencer');

  const filtered = useMemo(() => {
    return recolectoras.filter(r => {
      const matchSearch = !search || r.razon_social.toLowerCase().includes(search.toLowerCase()) || r.nit.includes(search);
      const matchEstado = filterEstado === 'todos' || r.estado === filterEstado;
      const matchCiudad = filterCiudad === 'todas' || r.ciudad === filterCiudad;
      return matchSearch && matchEstado && matchCiudad;
    });
  }, [search, filterEstado, filterCiudad, recolectoras]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      {porVencer.length > 0 && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-amber-300 bg-amber-50">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {porVencer.length} recolectora{porVencer.length > 1 ? 's' : ''} con licencia por vencer este mes
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-400 text-amber-700 hover:bg-amber-100" onClick={() => toast.success('Notificaciones enviadas')}>
            <Bell className="h-4 w-4 mr-1" /> Notificar a todas
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Empresas Recolectoras</h1>
          <p className="text-muted-foreground text-sm mt-1">{recolectoras.length} empresa{recolectoras.length !== 1 ? 's' : ''} registrada{recolectoras.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success('Exportación de recolectoras iniciada')}>
          <Download className="h-4 w-4 mr-2" /> Exportar Excel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre o NIT..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="activa">Activa</SelectItem>
              <SelectItem value="suspendida">Suspendida</SelectItem>
              <SelectItem value="inactiva">Inactiva</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCiudad} onValueChange={setFilterCiudad}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Ciudad" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las ciudades</SelectItem>
              {ciudades.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empresa</TableHead>
              <TableHead>NIT</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Licencia</TableHead>
              <TableHead>Fecha ingreso</TableHead>
              <TableHead className="text-center">Ofertas</TableHead>
              <TableHead className="text-center">Certificados</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No se encontraron empresas</TableCell></TableRow>
            )}
            {filtered.map(r => {
              const licConf = licenciaConfig[r.licencia.estado];
              const isVencida = r.licencia.estado === 'vencida';
              return (
                <TableRow key={r.id} className={`cursor-pointer hover:bg-muted/50 ${isVencida ? 'bg-amber-50/60' : ''}`} onClick={() => setSelected(r)}>
                  <TableCell className="font-medium">
                    {r.razon_social}
                    {isVencida && <Badge variant="outline" className="ml-2 text-[10px] bg-amber-100 text-amber-700 border-amber-300">Suspendida por licencia</Badge>}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{r.nit}</TableCell>
                  <TableCell>{r.ciudad}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className={`h-2.5 w-2.5 rounded-full ${licConf.dotClass}`} />
                      {licConf.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(r.created_at).toLocaleDateString('es-CO')}</TableCell>
                  <TableCell className="text-center">{r.solicitudes_activas}</TableCell>
                  <TableCell className="text-center">{r.certificados_totales}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={estadoConfig[r.estado].className}>{estadoConfig[r.estado].label}</Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Sheet open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0">
          {selected && (
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                <SheetHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <SheetTitle className="text-lg">{selected.razon_social}</SheetTitle>
                      <p className="text-sm text-muted-foreground">{selected.nit}</p>
                    </div>
                  </div>
                </SheetHeader>

                <Badge variant="outline" className={estadoConfig[selected.estado].className}>{estadoConfig[selected.estado].label}</Badge>

                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-sm text-foreground">Datos de la empresa</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Representante:</span><p className="font-medium">{selected.representante_legal}</p></div>
                    <div><span className="text-muted-foreground">Ciudad:</span><p className="font-medium">{selected.ciudad}</p></div>
                    <div><span className="text-muted-foreground">Email:</span><p className="font-medium">{selected.email_corporativo}</p></div>
                    <div><span className="text-muted-foreground">Teléfono:</span><p className="font-medium">{selected.telefono}</p></div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-headline font-bold text-sm text-foreground flex items-center gap-2"><Shield className="h-4 w-4" /> Licencia ambiental</h3>
                  <div className="p-4 rounded-lg border bg-card space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">Resolución:</span><p className="font-medium">{selected.licencia.numero_resolucion}</p></div>
                      <div><span className="text-muted-foreground">Autoridad:</span><p className="font-medium">{selected.licencia.autoridad}</p></div>
                      <div>
                        <span className="text-muted-foreground">Vencimiento:</span>
                        <p className="font-medium">{selected.licencia.fecha_vencimiento ? new Date(selected.licencia.fecha_vencimiento).toLocaleDateString('es-CO') : 'Sin fecha'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Estado:</span>
                        <p className="flex items-center gap-1.5 font-medium">
                          <span className={`h-2 w-2 rounded-full ${licenciaConfig[selected.licencia.estado].dotClass}`} />
                          {licenciaConfig[selected.licencia.estado].label}
                        </p>
                      </div>
                    </div>
                    {selected.licencia.categorias_autorizadas.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Tipos de residuos autorizados</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selected.licencia.categorias_autorizadas.map(cat => (
                              <Badge key={cat} variant="secondary" className="text-xs">{cat}</Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h3 className="font-headline font-bold text-sm text-foreground flex items-center gap-2"><FileText className="h-4 w-4" /> Documentos</h3>
                  {selected.documentos.length === 0 && <p className="text-sm text-muted-foreground">Sin documentos registrados</p>}
                  {selected.documentos.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div>
                        <p className="text-sm font-medium">{d.nombre}</p>
                        {d.fecha !== 'Sin fecha' && <p className="text-xs text-muted-foreground">Vence: {new Date(d.fecha).toLocaleDateString('es-CO')}</p>}
                      </div>
                      <span className={`text-xs font-semibold ${docEstadoConfig[d.estado] || ''}`}>{d.estado}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="font-headline font-bold text-sm text-foreground">Acciones</h3>
                  <div className="flex flex-wrap gap-2">
                    {selected.estado === 'activa' ? (
                      <Button variant="destructive" size="sm" onClick={() => { toast.success('Cuenta suspendida'); setSelected(null); }}>
                        <Ban className="h-4 w-4 mr-1" /> Suspender cuenta
                      </Button>
                    ) : (
                      <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => { toast.success('Cuenta reactivada'); setSelected(null); }}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Reactivar cuenta
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => toast.info('Funcionalidad de mensajes próximamente')}>
                      <Mail className="h-4 w-4 mr-1" /> Enviar mensaje
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
