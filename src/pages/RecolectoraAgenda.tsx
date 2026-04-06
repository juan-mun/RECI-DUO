import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays, List, MapPin, Clock, Package, Truck, Building2, CheckCircle2,
  Navigation, XCircle, ChevronLeft, ChevronRight, PartyPopper, Upload, FileText
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type Recoleccion = {
  id: string;
  status: string;
  precio_propuesto: number;
  fecha_disponible: string;
  recolectora_id: string;
  solicitud_id: string;
  solicitudes_recoleccion: {
    id: string;
    direccion_recoleccion: string;
    fecha_preferida: string;
    rango_horario_inicio: string;
    rango_horario_fin: string;
    user_id: string;
    solicitud_residuos: {
      id: string;
      cantidad_real: number;
      residuos: { nombre: string; categoria: string; unidad: string } | null;
    }[];
  } | null;
  generadora_profile?: { razon_social: string; nit: string; ciudad: string; representante_legal: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgClass: string; dotClass: string }> = {
  aceptada: { label: 'Confirmada', color: 'text-amber-800', bgClass: 'bg-amber-100 text-amber-800 border-amber-200', dotClass: 'bg-amber-400' },
  en_camino: { label: 'En camino', color: 'text-blue-800', bgClass: 'bg-blue-100 text-blue-800 border-blue-200', dotClass: 'bg-blue-400' },
  completada: { label: 'Completada', color: 'text-green-800', bgClass: 'bg-green-100 text-green-800 border-green-200', dotClass: 'bg-green-500' },
  cancelada: { label: 'Cancelada', color: 'text-red-800', bgClass: 'bg-red-100 text-red-800 border-red-200', dotClass: 'bg-red-400' },
};

const CALENDAR_COLORS: Record<string, string> = {
  aceptada: 'bg-amber-200 text-amber-900 hover:bg-amber-300',
  en_camino: 'bg-blue-200 text-blue-900 hover:bg-blue-300',
  completada: 'bg-green-200 text-green-900 hover:bg-green-300',
  cancelada: 'bg-red-200 text-red-900 hover:bg-red-300 line-through opacity-60',
};

export default function RecolectoraAgenda() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedRecoleccion, setSelectedRecoleccion] = useState<Recoleccion | null>(null);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Completion form state
  const [cantidadReal, setCantidadReal] = useState('');
  const [destinoFinal, setDestinoFinal] = useState('');
  const [metodoTratamiento, setMetodoTratamiento] = useState('');
  const [fotosEvidence, setFotosEvidence] = useState<File[]>([]);
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null);
  const [confirmaLegal, setConfirmaLegal] = useState(false);

  const { data: recolecciones = [], isLoading } = useQuery({
    queryKey: ['agenda-recolecciones', user?.id],
    queryFn: async () => {
      const { data: ofertas, error } = await supabase
        .from('ofertas_recoleccion')
        .select('*, solicitudes_recoleccion:solicitud_id(*, solicitud_residuos(*, residuos(nombre, categoria, unidad)))')
        .eq('recolectora_id', user!.id)
        .in('status', ['aceptada', 'en_camino', 'completada', 'cancelada'])
        .order('fecha_disponible', { ascending: true });
      if (error) throw error;

      // Fetch generadora profiles for each solicitud
      const userIds = [...new Set((ofertas || []).map((o: any) => o.solicitudes_recoleccion?.user_id).filter(Boolean))];
      let profilesMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, razon_social, nit, ciudad, representante_legal')
          .in('user_id', userIds);
        if (profiles) {
          profiles.forEach((p: any) => { profilesMap[p.user_id] = p; });
        }
      }

      return (ofertas || []).map((o: any) => ({
        ...o,
        generadora_profile: profilesMap[o.solicitudes_recoleccion?.user_id] || null,
      })) as Recoleccion[];
    },
    enabled: !!user,
  });

  // Recolectora profile for certificate generation
  const { data: recolectoraProfile } = useQuery({
    queryKey: ['recolectora-profile-cert', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: recolectoraLicencia } = useQuery({
    queryKey: ['recolectora-licencia-cert', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('registration_requests').select('numero_resolucion_licencia, autoridad_ambiental').eq('user_id', user!.id).eq('role', 'recolectora').eq('status', 'aprobada').maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Confirm arrival mutation
  const confirmArrivalMutation = useMutation({
    mutationFn: async (oferta: Recoleccion) => {
      const { error } = await supabase.from('ofertas_recoleccion').update({ status: 'en_camino' }).eq('id', oferta.id);
      if (error) throw error;
      // Update solicitud status so generadora tracking updates
      if (oferta.solicitud_id) {
        const { error: solError } = await supabase
          .from('solicitudes_recoleccion')
          .update({ status: 'en_proceso' })
          .eq('id', oferta.solicitud_id);
        if (solError) console.error('Error updating solicitud status:', solError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-recolecciones'] });
      toast.success('Llegada confirmada — estado actualizado a "En camino"');
      setSelectedRecoleccion(null);
    },
    onError: () => toast.error('Error al confirmar llegada'),
  });

  // Complete recoleccion mutation
  const completeMutation = useMutation({
    mutationFn: async ({ oferta, cantidadReal, destinoFinal, metodoTratamiento }: {
      oferta: Recoleccion; cantidadReal: number; destinoFinal: string; metodoTratamiento: string;
    }) => {
      // Upload evidence files
      if (fotosEvidence.length > 0 || comprobanteFile) {
        const files = [...fotosEvidence, ...(comprobanteFile ? [comprobanteFile] : [])];
        for (const file of files) {
          const sanitizedName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${user!.id}/${oferta.id}/${Date.now()}_${sanitizedName}`;
          const { error: uploadError } = await supabase.storage.from('recoleccion-evidencias').upload(path, file);
          if (uploadError) console.error('Upload error:', uploadError);
        }
      }

      // Update oferta status
      const { error: updateError } = await supabase.from('ofertas_recoleccion').update({ status: 'completada' }).eq('id', oferta.id);
      if (updateError) throw updateError;

      // Update solicitud status so generadora tracking updates
      if (oferta.solicitud_id) {
        await supabase
          .from('solicitudes_recoleccion')
          .update({ status: 'completada' })
          .eq('id', oferta.solicitud_id);
      }

      // Generate certificate
      const sol = oferta.solicitudes_recoleccion;
      const genProfile = oferta.generadora_profile;
      const firstResiduo = sol?.solicitud_residuos?.[0];

      if (!sol?.user_id) {
        throw new Error('No se pudo obtener la información de la empresa generadora');
      }

      const certData = {
        numero_certificado: `CERT-${Date.now().toString(36).toUpperCase()}`,
        solicitud_id: oferta.solicitud_id,
        generadora_id: sol.user_id,
        generadora_razon_social: genProfile?.razon_social || 'Sin información',
        generadora_nit: genProfile?.nit || 'Sin información',
        generadora_ciudad: genProfile?.ciudad || 'Sin información',
        generadora_representante: genProfile?.representante_legal || 'Sin información',
        recolectora_id: user!.id,
        recolectora_razon_social: recolectoraProfile?.razon_social || 'Sin información',
        recolectora_nit: recolectoraProfile?.nit || 'Sin información',
        recolectora_licencia_ambiental: recolectoraLicencia?.numero_resolucion_licencia || null,
        recolectora_autoridad_ambiental: recolectoraLicencia?.autoridad_ambiental || null,
        tipo_residuo: firstResiduo?.residuos?.nombre || 'Residuo',
        categoria_residuo: firstResiduo?.residuos?.categoria || 'General',
        cantidad_dispuesta: cantidadReal,
        unidad: firstResiduo?.residuos?.unidad || 'kg',
        fecha_recoleccion: oferta.fecha_disponible,
        destino_final: `${destinoFinal} — ${metodoTratamiento}`,
        codigo_verificacion: `VER-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      };

      const { error: certError } = await supabase.from('certificados').insert(certData);
      if (certError) throw certError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda-recolecciones'] });
      queryClient.invalidateQueries({ queryKey: ['certificados'] });
      setShowCompletionForm(false);
      setShowSuccess(true);
      resetCompletionForm();
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  const resetCompletionForm = () => {
    setCantidadReal('');
    setDestinoFinal('');
    setMetodoTratamiento('');
    setFotosEvidence([]);
    setComprobanteFile(null);
    setConfirmaLegal(false);
  };

  const handleSubmitCompletion = () => {
    if (!selectedRecoleccion || !cantidadReal || !destinoFinal || !metodoTratamiento || !confirmaLegal) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    completeMutation.mutate({
      oferta: selectedRecoleccion,
      cantidadReal: Number(cantidadReal),
      destinoFinal,
      metodoTratamiento,
    });
  };

  // Calendar helpers
  const monthStart = startOfMonth(calendarMonth);
  const monthEnd = endOfMonth(calendarMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0=Sun

  const eventsByDate = useMemo(() => {
    const map: Record<string, Recoleccion[]> = {};
    recolecciones.forEach((r) => {
      const dateKey = r.fecha_disponible;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(r);
    });
    return map;
  }, [recolecciones]);

  const activeRecolecciones = recolecciones.filter((r) => r.status !== 'cancelada');
  const sortedForList = [...recolecciones].sort((a, b) => {
    const order: Record<string, number> = { en_camino: 0, aceptada: 1, completada: 2, cancelada: 3 };
    return (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.fecha_disponible.localeCompare(b.fecha_disponible);
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold">Agenda de Recolecciones</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona tus recolecciones confirmadas, en curso y completadas.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-muted p-1">
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" /> Lista
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
            size="sm"
            className="gap-1.5"
            onClick={() => setViewMode('calendar')}
          >
            <CalendarDays className="h-4 w-4" /> Calendario
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
            <span className="text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg capitalize">
              {format(calendarMonth, 'MMMM yyyy', { locale: es })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground mb-2">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {/* Empty cells before month start */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-background min-h-[80px] p-1" />
              ))}
              {daysInMonth.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];
                const isToday = isSameDay(day, new Date());
                return (
                  <div
                    key={dateKey}
                    className={`bg-background min-h-[80px] p-1 ${isToday ? 'ring-2 ring-primary ring-inset' : ''}`}
                  >
                    <div className={`text-xs text-right mb-0.5 ${isToday ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((evt) => (
                        <button
                          key={evt.id}
                          onClick={() => setSelectedRecoleccion(evt)}
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${CALENDAR_COLORS[evt.status] || 'bg-muted'}`}
                        >
                          {evt.generadora_profile?.razon_social || 'Empresa'}
                        </button>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground text-center">+{dayEvents.length - 2} más</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {sortedForList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Truck className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-headline text-lg font-semibold mb-1">Sin recolecciones programadas</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Cuando tus ofertas sean aceptadas, aparecerán aquí como recolecciones confirmadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sortedForList.map((rec) => {
                const sol = rec.solicitudes_recoleccion;
                const cfg = STATUS_CONFIG[rec.status] || STATUS_CONFIG.aceptada;
                const firstResiduo = sol?.solicitud_residuos?.[0];
                return (
                  <Card key={rec.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cfg.bgClass}>{cfg.label}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(rec.fecha_disponible + 'T00:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                            {rec.generadora_profile?.razon_social || 'Empresa generadora'}
                          </div>

                          <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>{sol?.direccion_recoleccion}</span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {sol?.rango_horario_inicio?.slice(0, 5)} – {sol?.rango_horario_fin?.slice(0, 5)}
                            </span>
                            {firstResiduo && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3.5 w-3.5" />
                                {firstResiduo.residuos?.nombre} · {firstResiduo.cantidad_real} {firstResiduo.residuos?.unidad}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {sol?.solicitud_residuos?.map((sr) => (
                              <span key={sr.id} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {sr.residuos?.nombre}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setSelectedRecoleccion(rec)}>
                            Ver detalle
                          </Button>
                          {rec.status === 'aceptada' && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => confirmArrivalMutation.mutate(rec)}
                              disabled={confirmArrivalMutation.isPending}
                            >
                              <Navigation className="h-3.5 w-3.5" /> Confirmar llegada
                            </Button>
                          )}
                          {rec.status === 'en_camino' && (
                            <Button
                              size="sm"
                              variant="default"
                              className="gap-1"
                              onClick={() => { setSelectedRecoleccion(rec); setShowCompletionForm(true); }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Completar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRecoleccion && !showCompletionForm && !showSuccess} onOpenChange={(v) => { if (!v) setSelectedRecoleccion(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Recolección</DialogTitle>
            <DialogDescription>
              {selectedRecoleccion && (
                <Badge className={STATUS_CONFIG[selectedRecoleccion.status]?.bgClass}>
                  {STATUS_CONFIG[selectedRecoleccion.status]?.label}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedRecoleccion && (() => {
            const sol = selectedRecoleccion.solicitudes_recoleccion;
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Empresa Generadora</h4>
                  <Separator />
                  <p className="font-medium">{selectedRecoleccion.generadora_profile?.razon_social || '—'}</p>
                  <p className="text-sm text-muted-foreground">NIT: {selectedRecoleccion.generadora_profile?.nit || '—'}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ubicación y Horario</h4>
                  <Separator />
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    {sol?.direccion_recoleccion}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(selectedRecoleccion.fecha_disponible + 'T00:00:00'), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {sol?.rango_horario_inicio?.slice(0, 5)} – {sol?.rango_horario_fin?.slice(0, 5)}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Residuos</h4>
                  <Separator />
                  {sol?.solicitud_residuos?.map((sr) => (
                    <div key={sr.id} className="flex items-center justify-between text-sm">
                      <span>{sr.residuos?.nombre} <Badge variant="outline" className="ml-1 text-[10px]">{sr.residuos?.categoria}</Badge></span>
                      <span className="font-medium">{sr.cantidad_real} {sr.residuos?.unidad}</span>
                    </div>
                  ))}
                </div>

                <div className="text-sm">
                  <span className="text-muted-foreground">Precio acordado:</span>{' '}
                  <span className="font-semibold text-primary">${Number(selectedRecoleccion.precio_propuesto).toLocaleString('es-CO')} COP</span>
                </div>

                <DialogFooter className="gap-2">
                  {selectedRecoleccion.status === 'aceptada' && (
                    <Button className="gap-1" onClick={() => confirmArrivalMutation.mutate(selectedRecoleccion)} disabled={confirmArrivalMutation.isPending}>
                      <Navigation className="h-4 w-4" /> Confirmar llegada
                    </Button>
                  )}
                  {selectedRecoleccion.status === 'en_camino' && (
                    <Button className="gap-1" onClick={() => setShowCompletionForm(true)}>
                      <CheckCircle2 className="h-4 w-4" /> Registrar recolección completada
                    </Button>
                  )}
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Completion Form Dialog */}
      <Dialog open={showCompletionForm} onOpenChange={(v) => { if (!v) { setShowCompletionForm(false); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Recolección Completada</DialogTitle>
            <DialogDescription>
              Completa los datos de la recolección para generar el certificado de disposición final.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Cantidad real recolectada *</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ej: 150"
                  value={cantidadReal}
                  onChange={(e) => setCantidadReal(e.target.value)}
                />
                <span className="text-sm text-muted-foreground shrink-0">
                  {selectedRecoleccion?.solicitudes_recoleccion?.solicitud_residuos?.[0]?.residuos?.unidad || 'kg'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Destino final del residuo *</Label>
              <Input placeholder="Nombre del sitio de disposición" value={destinoFinal} onChange={(e) => setDestinoFinal(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Método de tratamiento *</Label>
              <Select value={metodoTratamiento} onValueChange={setMetodoTratamiento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un método" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aprovechamiento">Aprovechamiento</SelectItem>
                  <SelectItem value="Tratamiento">Tratamiento</SelectItem>
                  <SelectItem value="Disposición final">Disposición final</SelectItem>
                  <SelectItem value="Reciclaje">Reciclaje</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Fotos de evidencia (opcional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  id="fotos-input"
                  className="hidden"
                  onChange={(e) => setFotosEvidence(Array.from(e.target.files || []))}
                />
                <label htmlFor="fotos-input" className="cursor-pointer flex flex-col items-center gap-1">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click para subir fotos</span>
                </label>
                {fotosEvidence.length > 0 && (
                  <p className="text-xs text-primary mt-2">{fotosEvidence.length} archivo(s) seleccionado(s)</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Comprobante del sitio de disposición (PDF, opcional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  id="comprobante-input"
                  className="hidden"
                  onChange={(e) => setComprobanteFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="comprobante-input" className="cursor-pointer flex flex-col items-center gap-1">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click para subir PDF</span>
                </label>
                {comprobanteFile && (
                  <p className="text-xs text-primary mt-2">{comprobanteFile.name}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-2">
              <Checkbox
                id="confirma-legal"
                checked={confirmaLegal}
                onCheckedChange={(v) => setConfirmaLegal(v === true)}
              />
              <label htmlFor="confirma-legal" className="text-sm leading-snug cursor-pointer">
                Confirmo que la información proporcionada es verídica y que el residuo fue transportado y dispuesto conforme a la normatividad ambiental vigente en Colombia.
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompletionForm(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmitCompletion}
              disabled={completeMutation.isPending || !confirmaLegal || !cantidadReal || !destinoFinal || !metodoTratamiento}
              className="gap-1"
            >
              {completeMutation.isPending ? 'Procesando...' : 'Registrar y emitir certificado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={(v) => { if (!v) { setShowSuccess(false); setSelectedRecoleccion(null); } }}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-in zoom-in-50 duration-500">
              <PartyPopper className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold font-headline">¡Recolección completada!</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Certificado emitido — el generador ya puede descargarlo desde su panel.
            </p>
            <Button onClick={() => { setShowSuccess(false); setSelectedRecoleccion(null); }}>
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
