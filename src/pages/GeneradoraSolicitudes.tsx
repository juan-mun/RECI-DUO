import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, FileText, CalendarIcon, Star, ShieldCheck, ArrowLeft, X, MessageSquare, ThumbsDown, Package, Truck, CheckCircle2, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const ESTADOS = [
  { value: 'todos', label: 'Todos' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'con_ofertas', label: 'Con ofertas' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const statusColors: Record<string, string> = {
  publicada: 'bg-blue-100 text-blue-800',
  con_ofertas: 'bg-yellow-100 text-yellow-800',
  aceptada: 'bg-green-100 text-green-800',
  en_proceso: 'bg-purple-100 text-purple-800',
  completada: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-800',
};

type Residuo = {
  id: string;
  categoria: string;
  nombre: string;
  unidad: string;
  activo: boolean;
};

type ResiduoSeleccionado = {
  residuo_id: string;
  cantidad_real: string;
};

type Solicitud = {
  id: string;
  direccion_recoleccion: string;
  notas_acceso: string | null;
  fecha_preferida: string;
  rango_horario_inicio: string;
  rango_horario_fin: string;
  instrucciones_especiales: string | null;
  status: string;
  created_at: string;
};

type Oferta = {
  id: string;
  solicitud_id: string;
  recolectora_id: string;
  precio_propuesto: number;
  fecha_disponible: string;
  mensaje: string | null;
  status: string;
  recolectora_nombre?: string;
  calificacion?: number;
  licencia_verificada?: boolean;
};

type SolicitudResiduo = {
  id: string;
  residuo_id: string;
  cantidad_real: number;
  residuo?: Residuo;
};

export default function GeneradoraSolicitudes() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [openNew, setOpenNew] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<string | null>(null);

  // Form state
  const [direccion, setDireccion] = useState('');
  const [notasAcceso, setNotasAcceso] = useState('');
  const [fechaPreferida, setFechaPreferida] = useState<Date>();
  const [horarioInicio, setHorarioInicio] = useState('08:00');
  const [horarioFin, setHorarioFin] = useState('17:00');
  const [instrucciones, setInstrucciones] = useState('');
  const [residuosSeleccionados, setResiduosSeleccionados] = useState<ResiduoSeleccionado[]>([]);

  // Queries
  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitudes_recoleccion')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Solicitud[];
    },
    enabled: !!user,
  });

  const { data: misResiduos = [] } = useQuery({
    queryKey: ['residuos-activos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residuos')
        .select('id, categoria, nombre, unidad, activo')
        .eq('activo', true)
        .order('nombre');
      if (error) throw error;
      return data as Residuo[];
    },
    enabled: !!user,
  });

  const { data: solicitudResiduos = [] } = useQuery({
    queryKey: ['solicitud-residuos', selectedSolicitud],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('solicitud_residuos')
        .select('*')
        .eq('solicitud_id', selectedSolicitud!);
      if (error) throw error;
      // Enrich with residuo info
      const residuoIds = data.map((sr: any) => sr.residuo_id);
      const { data: residuosData } = await supabase
        .from('residuos')
        .select('id, categoria, nombre, unidad, activo')
        .in('id', residuoIds);
      return data.map((sr: any) => ({
        ...sr,
        residuo: residuosData?.find((r: any) => r.id === sr.residuo_id),
      })) as SolicitudResiduo[];
    },
    enabled: !!selectedSolicitud,
  });

  const { data: ofertas = [] } = useQuery({
    queryKey: ['ofertas', selectedSolicitud],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_recoleccion')
        .select('*')
        .eq('solicitud_id', selectedSolicitud!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      // Enrich with profile info
      const recolectoraIds = data.map((o: any) => o.recolectora_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, razon_social')
        .in('user_id', recolectoraIds);
      return data.map((o: any) => ({
        ...o,
        recolectora_nombre: profiles?.find((p: any) => p.user_id === o.recolectora_id)?.razon_social || 'Recolectora',
        calificacion: 4.5, // placeholder
        licencia_verificada: true, // placeholder
      })) as Oferta[];
    },
    enabled: !!selectedSolicitud,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!fechaPreferida || !direccion || residuosSeleccionados.length === 0) {
        throw new Error('Completa los campos obligatorios');
      }
      for (const rs of residuosSeleccionados) {
        if (!rs.cantidad_real || Number(rs.cantidad_real) <= 0) {
          throw new Error('Ingresa cantidades válidas para todos los residuos');
        }
      }

      const { data: sol, error } = await supabase
        .from('solicitudes_recoleccion')
        .insert({
          user_id: user!.id,
          direccion_recoleccion: direccion,
          notas_acceso: notasAcceso || null,
          fecha_preferida: format(fechaPreferida, 'yyyy-MM-dd'),
          rango_horario_inicio: horarioInicio,
          rango_horario_fin: horarioFin,
          instrucciones_especiales: instrucciones || null,
        })
        .select()
        .single();
      if (error) throw error;

      const residuosPayload = residuosSeleccionados.map((rs) => ({
        solicitud_id: sol.id,
        residuo_id: rs.residuo_id,
        cantidad_real: Number(rs.cantidad_real),
      }));
      const { error: resError } = await supabase.from('solicitud_residuos').insert(residuosPayload);
      if (resError) throw resError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast.success('Solicitud creada exitosamente');
      resetForm();
    },
    onError: (err: Error) => toast.error(err.message || 'Error al crear la solicitud'),
  });

  // Negotiate modal state
  const [negotiateOferta, setNegotiateOferta] = useState<Oferta | null>(null);
  const [contraPrecio, setContraPrecio] = useState('');
  const [contraFecha, setContraFecha] = useState<Date | undefined>();
  const [contraMensaje, setContraMensaje] = useState('');

  const acceptOfertaMutation = useMutation({
    mutationFn: async (ofertaId: string) => {
      const { error: ofError } = await supabase
        .from('ofertas_recoleccion')
        .update({ status: 'aceptada' })
        .eq('id', ofertaId);
      if (ofError) throw ofError;

      const { error: solError } = await supabase
        .from('solicitudes_recoleccion')
        .update({ status: 'aceptada' })
        .eq('id', selectedSolicitud!);
      if (solError) throw solError;

      const { error: rejError } = await supabase
        .from('ofertas_recoleccion')
        .update({ status: 'rechazada' })
        .eq('solicitud_id', selectedSolicitud!)
        .neq('id', ofertaId);
      if (rejError) throw rejError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast.success('Oferta aceptada');
    },
    onError: () => toast.error('Error al aceptar la oferta'),
  });

  const rejectOfertaMutation = useMutation({
    mutationFn: async (ofertaId: string) => {
      const { error } = await supabase
        .from('ofertas_recoleccion')
        .update({ status: 'rechazada' })
        .eq('id', ofertaId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast.success('Oferta rechazada');
    },
    onError: () => toast.error('Error al rechazar la oferta'),
  });

  const negotiateOfertaMutation = useMutation({
    mutationFn: async () => {
      if (!negotiateOferta || !contraPrecio || !contraFecha) throw new Error('Campos requeridos');
      const { error } = await supabase
        .from('ofertas_recoleccion')
        .update({
          status: 'negociando',
          contrapropuesta_precio: parseFloat(contraPrecio),
          contrapropuesta_fecha: format(contraFecha, 'yyyy-MM-dd'),
          contrapropuesta_mensaje: contraMensaje || null,
        })
        .eq('id', negotiateOferta.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ofertas'] });
      toast.success('Contrapropuesta enviada');
      setNegotiateOferta(null);
      setContraPrecio('');
      setContraFecha(undefined);
      setContraMensaje('');
    },
    onError: () => toast.error('Error al enviar la contrapropuesta'),
  });

  const resetForm = () => {
    setOpenNew(false);
    setDireccion('');
    setNotasAcceso('');
    setFechaPreferida(undefined);
    setHorarioInicio('08:00');
    setHorarioFin('17:00');
    setInstrucciones('');
    setResiduosSeleccionados([]);
  };

  const toggleResiduo = (residuoId: string) => {
    setResiduosSeleccionados((prev) => {
      const exists = prev.find((r) => r.residuo_id === residuoId);
      if (exists) return prev.filter((r) => r.residuo_id !== residuoId);
      return [...prev, { residuo_id: residuoId, cantidad_real: '' }];
    });
  };

  const updateCantidad = (residuoId: string, cantidad: string) => {
    setResiduosSeleccionados((prev) =>
      prev.map((r) => (r.residuo_id === residuoId ? { ...r, cantidad_real: cantidad } : r))
    );
  };

  const filteredSolicitudes = filtroEstado === 'todos'
    ? solicitudes
    : solicitudes.filter((s) => s.status === filtroEstado);

  const selectedSol = solicitudes.find((s) => s.id === selectedSolicitud);

  // Detail view
  if (selectedSolicitud && selectedSol) {
    return (
      <div className="p-6 space-y-6">
        <Button variant="ghost" onClick={() => setSelectedSolicitud(null)} className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4" /> Volver a solicitudes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-2xl font-bold">Detalle de Solicitud</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Creada el {format(new Date(selectedSol.created_at), "d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <Badge className={cn('text-sm px-3 py-1', statusColors[selectedSol.status] || '')}>
            {ESTADOS.find((e) => e.value === selectedSol.status)?.label || selectedSol.status}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Información de recolección</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="font-medium">Dirección:</span> {selectedSol.direccion_recoleccion}</div>
              {selectedSol.notas_acceso && <div><span className="font-medium">Notas de acceso:</span> {selectedSol.notas_acceso}</div>}
              <div><span className="font-medium">Fecha preferida:</span> {format(new Date(selectedSol.fecha_preferida + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}</div>
              <div><span className="font-medium">Horario:</span> {selectedSol.rango_horario_inicio.slice(0, 5)} - {selectedSol.rango_horario_fin.slice(0, 5)}</div>
              {selectedSol.instrucciones_especiales && <div><span className="font-medium">Instrucciones:</span> {selectedSol.instrucciones_especiales}</div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Residuos solicitados</CardTitle></CardHeader>
            <CardContent>
              {solicitudResiduos.length === 0 ? (
                <p className="text-muted-foreground text-sm">Cargando residuos...</p>
              ) : (
                <div className="space-y-2">
                  {solicitudResiduos.map((sr) => (
                    <div key={sr.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
                      <div>
                        <span className="font-medium">{sr.residuo?.nombre || 'Residuo'}</span>
                        <Badge variant="outline" className="ml-2 text-xs">{sr.residuo?.categoria}</Badge>
                      </div>
                      <span className="text-muted-foreground">{sr.cantidad_real} {sr.residuo?.unidad}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tracking timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-5 w-5" /> Seguimiento de la solicitud
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const TRACKING_STEPS = [
                { key: 'publicada', label: 'Solicitud publicada', icon: FileText, description: 'Tu solicitud fue publicada y está visible para recolectoras certificadas.' },
                { key: 'con_ofertas', label: 'Ofertas recibidas', icon: Package, description: 'Recolectoras han enviado propuestas para tu solicitud.' },
                { key: 'aceptada', label: 'Oferta aceptada', icon: CheckCircle2, description: 'Seleccionaste una recolectora. Se coordina la recolección.' },
                { key: 'en_proceso', label: 'Recolección en proceso', icon: Truck, description: 'La recolectora está en camino o realizando la recolección.' },
                { key: 'completada', label: 'Completada', icon: CheckCircle2, description: 'Los residuos fueron recolectados y dispuestos correctamente.' },
              ];
              const statusOrder = ['publicada', 'con_ofertas', 'aceptada', 'en_proceso', 'completada'];
              const currentIndex = statusOrder.indexOf(selectedSol.status);
              const isCancelled = selectedSol.status === 'cancelada';

              if (isCancelled) {
                return (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 text-destructive">
                    <X className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Solicitud cancelada</p>
                      <p className="text-sm opacity-80">Esta solicitud fue cancelada y ya no está activa.</p>
                    </div>
                  </div>
                );
              }

              return (
                <div className="relative">
                  {TRACKING_STEPS.map((step, index) => {
                    const isCompleted = index <= currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.key} className="flex gap-4 relative">
                        {/* Vertical line */}
                        {index < TRACKING_STEPS.length - 1 && (
                          <div
                            className={cn(
                              'absolute left-[15px] top-[32px] w-0.5 h-[calc(100%-16px)]',
                              index < currentIndex ? 'bg-primary' : 'bg-border'
                            )}
                          />
                        )}
                        {/* Circle */}
                        <div className={cn(
                          'relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-colors',
                          isCompleted
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground border-2 border-border'
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        {/* Content */}
                        <div className={cn('pb-6', index === TRACKING_STEPS.length - 1 && 'pb-0')}>
                          <p className={cn(
                            'font-medium text-sm',
                            isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                          )}>
                            {step.label}
                            {isCurrent && (
                              <Badge variant="outline" className="ml-2 text-xs animate-pulse">
                                <Clock className="h-3 w-3 mr-1" /> Actual
                              </Badge>
                            )}
                          </p>
                          <p className={cn(
                            'text-xs mt-0.5',
                            isCompleted ? 'text-muted-foreground' : 'text-muted-foreground/50'
                          )}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Ofertas section */}
        {(selectedSol.status === 'con_ofertas' || ofertas.length > 0) && (
          <div className="space-y-4">
            <h2 className="font-headline text-xl font-semibold">Ofertas recibidas ({ofertas.length})</h2>
            {ofertas.length === 0 ? (
              <p className="text-muted-foreground">No hay ofertas aún.</p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ofertas.map((oferta) => (
                  <Card key={oferta.id} className="relative">
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{oferta.recolectora_nombre}</h3>
                        {oferta.licencia_verificada && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <ShieldCheck className="h-3 w-3" /> Licencia verificada
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              'h-4 w-4',
                              star <= Math.floor(oferta.calificacion || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : star - 0.5 <= (oferta.calificacion || 0)
                                ? 'fill-yellow-200 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{oferta.calificacion}</span>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio propuesto</span>
                          <span className="font-bold text-lg">${oferta.precio_propuesto.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha disponible</span>
                          <span>{format(new Date(oferta.fecha_disponible + 'T00:00:00'), "d MMM yyyy", { locale: es })}</span>
                        </div>
                      </div>

                      {oferta.mensaje && (
                        <p className="text-sm text-muted-foreground italic">"{oferta.mensaje}"</p>
                      )}

                      {(selectedSol.status === 'con_ofertas' || selectedSol.status === 'publicada') && oferta.status === 'pendiente' && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            className="flex-1"
                            onClick={() => acceptOfertaMutation.mutate(oferta.id)}
                            disabled={acceptOfertaMutation.isPending}
                          >
                            Aceptar
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-1"
                            onClick={() => {
                              setNegotiateOferta(oferta);
                              setContraPrecio(String(oferta.precio_propuesto));
                              setContraFecha(new Date(oferta.fecha_disponible + 'T00:00:00'));
                            }}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            Negociar
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => rejectOfertaMutation.mutate(oferta.id)}
                            disabled={rejectOfertaMutation.isPending}
                            title="Rechazar oferta"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      {oferta.status === 'negociando' && (
                        <div className="space-y-2 mt-2">
                          <Badge className="w-full justify-center bg-amber-100 text-amber-800 border-amber-200">
                            <MessageSquare className="h-3 w-3 mr-1" /> En negociación
                          </Badge>
                          <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2 space-y-1">
                            <p><span className="font-medium">Tu contrapropuesta:</span></p>
                            {(oferta as any).contrapropuesta_precio && (
                              <p>Precio: ${Number((oferta as any).contrapropuesta_precio).toLocaleString('es-CO')} COP</p>
                            )}
                            {(oferta as any).contrapropuesta_fecha && (
                              <p>Fecha: {format(new Date((oferta as any).contrapropuesta_fecha + 'T00:00:00'), "d MMM yyyy", { locale: es })}</p>
                            )}
                            {(oferta as any).contrapropuesta_mensaje && (
                              <p className="italic">"{(oferta as any).contrapropuesta_mensaje}"</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => acceptOfertaMutation.mutate(oferta.id)}
                              disabled={acceptOfertaMutation.isPending}
                            >
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-destructive border-destructive/30 hover:bg-destructive/10"
                              onClick={() => rejectOfertaMutation.mutate(oferta.id)}
                              disabled={rejectOfertaMutation.isPending}
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      )}

                      {oferta.status === 'aceptada' && (
                        <Badge className="w-full justify-center bg-green-100 text-green-800">Aceptada</Badge>
                      )}
                      {oferta.status === 'rechazada' && (
                        <Badge className="w-full justify-center" variant="secondary">Rechazada</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dialog de negociación */}
        <Dialog open={!!negotiateOferta} onOpenChange={(v) => { if (!v) { setNegotiateOferta(null); setContraPrecio(''); setContraFecha(undefined); setContraMensaje(''); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Negociar Oferta</DialogTitle>
              <DialogDescription>
                Envía una contrapropuesta a {negotiateOferta?.recolectora_nombre}. La recolectora podrá aceptar tus nuevos términos o retirar su oferta.
              </DialogDescription>
            </DialogHeader>
            {negotiateOferta && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <p className="font-medium">Oferta original:</p>
                  <p className="text-muted-foreground">Precio: ${negotiateOferta.precio_propuesto.toLocaleString('es-CO')} COP</p>
                  <p className="text-muted-foreground">Fecha: {format(new Date(negotiateOferta.fecha_disponible + 'T00:00:00'), "d MMM yyyy", { locale: es })}</p>
                </div>

                <div className="space-y-2">
                  <Label>Precio sugerido (COP) *</Label>
                  <Input
                    type="number"
                    value={contraPrecio}
                    onChange={(e) => setContraPrecio(e.target.value)}
                    placeholder="Ej: 300000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Fecha sugerida *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !contraFecha && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {contraFecha ? format(contraFecha, "d 'de' MMMM, yyyy", { locale: es }) : "Selecciona fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={contraFecha} onSelect={setContraFecha} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Mensaje (opcional)</Label>
                  <Textarea
                    placeholder="Explica tu contrapropuesta..."
                    value={contraMensaje}
                    onChange={(e) => setContraMensaje(e.target.value.slice(0, 300))}
                    rows={3}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground text-right">{contraMensaje.length}/300</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => { setNegotiateOferta(null); setContraPrecio(''); setContraFecha(undefined); setContraMensaje(''); }}>Cancelar</Button>
              <Button onClick={() => negotiateOfertaMutation.mutate()} disabled={negotiateOfertaMutation.isPending || !contraPrecio || !contraFecha}>
                {negotiateOfertaMutation.isPending ? 'Enviando...' : 'Enviar contrapropuesta'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Solicitudes de Recolección</h1>
          <p className="text-muted-foreground text-sm mt-1">Crea y gestiona tus solicitudes de recolección de residuos.</p>
        </div>
        <Button onClick={() => setOpenNew(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva solicitud
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {ESTADOS.map((e) => (
          <Button
            key={e.value}
            variant={filtroEstado === e.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFiltroEstado(e.value)}
          >
            {e.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : filteredSolicitudes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-headline text-xl font-semibold">
            {filtroEstado === 'todos' ? 'No tienes solicitudes' : 'Sin resultados para este filtro'}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {filtroEstado === 'todos'
              ? 'Crea tu primera solicitud de recolección seleccionando residuos de tu inventario.'
              : 'No hay solicitudes con el estado seleccionado.'}
          </p>
          {filtroEstado === 'todos' && (
            <Button onClick={() => setOpenNew(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Crear mi primera solicitud
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha solicitud</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Fecha preferida</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSolicitudes.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelectedSolicitud(s.id)}>
                  <TableCell className="text-sm">
                    {format(new Date(s.created_at), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] truncate">{s.direccion_recoleccion}</TableCell>
                  <TableCell>{format(new Date(s.fecha_preferida + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                  <TableCell className="text-sm">{s.rango_horario_inicio.slice(0, 5)} - {s.rango_horario_fin.slice(0, 5)}</TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', statusColors[s.status] || '')}>
                      {ESTADOS.find((e) => e.value === s.status)?.label || s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Ver detalle</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* New solicitud dialog */}
      <Dialog open={openNew} onOpenChange={(v) => { if (!v) resetForm(); else setOpenNew(true); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Recolección</DialogTitle>
            <DialogDescription>Selecciona los residuos a recolectar y completa los datos de la solicitud.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Residuos selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Residuos a recolectar *</Label>
              {misResiduos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tienes residuos activos. Registra residuos primero en "Mis Residuos".</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {misResiduos.map((r) => {
                    const selected = residuosSeleccionados.find((rs) => rs.residuo_id === r.id);
                    return (
                      <div key={r.id} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={!!selected}
                            onCheckedChange={() => toggleResiduo(r.id)}
                          />
                          <div className="flex-1">
                            <span className="font-medium text-sm">{r.nombre}</span>
                            <Badge variant="outline" className="ml-2 text-xs">{r.categoria}</Badge>
                          </div>
                        </div>
                        {selected && (
                          <div className="ml-8 flex items-center gap-2">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Cantidad real"
                              value={selected.cantidad_real}
                              onChange={(e) => updateCantidad(r.id, e.target.value)}
                              className="w-32 h-8 text-sm"
                            />
                            <span className="text-sm text-muted-foreground">{r.unidad}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dirección */}
            <div className="space-y-2">
              <Label>Dirección de recolección *</Label>
              <Input value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Dirección completa..." />
            </div>

            <div className="space-y-2">
              <Label>Notas de acceso</Label>
              <Textarea value={notasAcceso} onChange={(e) => setNotasAcceso(e.target.value)} placeholder="Ej: Portería principal, preguntar por bodega 3..." rows={2} />
            </div>

            {/* Fecha y horario */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Fecha preferida *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !fechaPreferida && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaPreferida ? format(fechaPreferida, 'dd/MM/yyyy') : 'Seleccionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fechaPreferida}
                      onSelect={setFechaPreferida}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Hora inicio *</Label>
                <Input type="time" value={horarioInicio} onChange={(e) => setHorarioInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hora fin *</Label>
                <Input type="time" value={horarioFin} onChange={(e) => setHorarioFin(e.target.value)} />
              </div>
            </div>

            {/* Instrucciones */}
            <div className="space-y-2">
              <Label>Instrucciones especiales</Label>
              <Textarea value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} placeholder="Indicaciones adicionales para la recolección..." rows={2} />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || !direccion || !fechaPreferida || residuosSeleccionados.length === 0}
            >
              {createMutation.isPending ? 'Creando...' : 'Publicar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
