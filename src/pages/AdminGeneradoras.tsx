import { useState, useEffect, useMemo } from 'react';
import { Factory, Search, Download, X, FileText, Award, ClipboardList, Ban, CheckCircle, Mail, Loader2 } from 'lucide-react';
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

interface Generadora {
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
  documentos: { nombre: string; estado: string; fecha: string }[];
}

const estadoConfig: Record<string, { label: string; className: string }> = {
  activa: { label: 'Activa', className: 'bg-primary/15 text-primary border-primary/30' },
  suspendida: { label: 'Suspendida', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  inactiva: { label: 'Inactiva', className: 'bg-muted text-muted-foreground border-border' },
};

const docEstadoConfig: Record<string, string> = {
  Vigente: 'text-primary',
  'Por vencer': 'text-amber-600',
  Vencido: 'text-destructive',
  'Pendiente': 'text-muted-foreground',
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

export default function AdminGeneradoras() {
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterCiudad, setFilterCiudad] = useState('todas');
  const [selected, setSelected] = useState<Generadora | null>(null);
  const [generadoras, setGeneradoras] = useState<Generadora[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Get all generadora user_ids
        const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'generadora');
        if (!roles || roles.length === 0) { setLoading(false); return; }
        const userIds = roles.map(r => r.user_id);

        // Get profiles
        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', userIds);

        // Get solicitudes counts
        const { data: solicitudes } = await supabase.from('solicitudes_recoleccion').select('user_id, status');

        // Get certificados counts
        const { data: certificados } = await supabase.from('certificados').select('generadora_id');

        // Get registration requests + docs
        const { data: requests } = await supabase.from('registration_requests').select('id, user_id, status').in('user_id', userIds);

        const requestIds = requests?.map(r => r.id) || [];
        const { data: docs } = await supabase.from('registration_documents').select('*').in('request_id', requestIds);

        const result: Generadora[] = (profiles || []).map(p => {
          const solActivas = solicitudes?.filter(s => s.user_id === p.user_id && ['publicada', 'con_ofertas'].includes(s.status)).length || 0;
          const certsTotal = certificados?.filter(c => c.generadora_id === p.user_id).length || 0;
          const req = requests?.find(r => r.user_id === p.user_id);
          const empresaDocs = docs?.filter(d => d.request_id === req?.id) || [];

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
            solicitudes_activas: solActivas,
            certificados_totales: certsTotal,
            estado: 'activa' as const,
            documentos: empresaDocs.map(d => ({
              nombre: d.document_name,
              estado: getDocStatus(d.validation_status, d.fecha_vencimiento),
              fecha: d.fecha_vencimiento || 'Sin fecha',
            })),
          };
        });

        setGeneradoras(result);
      } catch (err) {
        console.error('Error fetching generadoras:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const ciudades = useMemo(() => [...new Set(generadoras.map(g => g.ciudad))], [generadoras]);

  const filtered = useMemo(() => {
    return generadoras.filter(g => {
      const matchSearch = !search || g.razon_social.toLowerCase().includes(search.toLowerCase()) || g.nit.includes(search);
      const matchEstado = filterEstado === 'todos' || g.estado === filterEstado;
      const matchCiudad = filterCiudad === 'todas' || g.ciudad === filterCiudad;
      return matchSearch && matchEstado && matchCiudad;
    });
  }, [search, filterEstado, filterCiudad, generadoras]);

  const handleExport = () => toast.success('Exportación de generadoras iniciada');

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Empresas Generadoras</h1>
          <p className="text-muted-foreground text-sm mt-1">{generadoras.length} empresa{generadoras.length !== 1 ? 's' : ''} registrada{generadoras.length !== 1 ? 's' : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
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
              <TableHead>Fecha ingreso</TableHead>
              <TableHead className="text-center">Solicitudes</TableHead>
              <TableHead className="text-center">Certificados</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron empresas</TableCell></TableRow>
            )}
            {filtered.map(g => (
              <TableRow key={g.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(g)}>
                <TableCell className="font-medium">{g.razon_social}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{g.nit}</TableCell>
                <TableCell>{g.ciudad}</TableCell>
                <TableCell className="text-sm">{new Date(g.created_at).toLocaleDateString('es-CO')}</TableCell>
                <TableCell className="text-center">{g.solicitudes_activas}</TableCell>
                <TableCell className="text-center">{g.certificados_totales}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={estadoConfig[g.estado].className}>{estadoConfig[g.estado].label}</Badge>
                </TableCell>
              </TableRow>
            ))}
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
                      <Factory className="h-5 w-5 text-primary" />
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
                    <div><span className="text-muted-foreground">Fecha ingreso:</span><p className="font-medium">{new Date(selected.created_at).toLocaleDateString('es-CO')}</p></div>
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
                  <h3 className="font-headline font-bold text-sm text-foreground">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-headline font-bold text-foreground">{selected.solicitudes_activas}</p>
                      <p className="text-xs text-muted-foreground">Solicitudes activas</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-2xl font-headline font-bold text-foreground">{selected.certificados_totales}</p>
                      <p className="text-xs text-muted-foreground">Certificados</p>
                    </div>
                  </div>
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
