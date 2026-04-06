import { useState, useEffect, useMemo } from 'react';
import { AlertTriangle, Clock, ExternalLink, Mail, CheckCircle, Shield, Info, Bell, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Severidad = 'urgente' | 'atencion' | 'informativo';
type FilterType = 'todas' | 'urgente' | 'atencion' | 'informativo' | 'resueltas';

interface Alerta {
  id: string;
  severidad: Severidad;
  titulo: string;
  descripcion: string;
  entidad: string;
  entidadUrl: string;
  tiempoTranscurrido: string;
  resuelta: boolean;
  notaResolucion?: string;
}

const sevConfig: Record<Severidad, { label: string; badgeClass: string; icon: typeof AlertTriangle; borderClass: string; bgClass: string }> = {
  urgente: { label: 'Urgente', badgeClass: 'bg-destructive text-destructive-foreground', icon: AlertTriangle, borderClass: 'border-l-destructive', bgClass: 'bg-destructive/5' },
  atencion: { label: 'Atención', badgeClass: 'bg-amber-500 text-white', icon: Bell, borderClass: 'border-l-amber-500', bgClass: 'bg-amber-50' },
  informativo: { label: 'Informativo', badgeClass: 'bg-accent text-accent-foreground', icon: Info, borderClass: 'border-l-accent', bgClass: 'bg-accent/5' },
};

const sevOrder: Record<Severidad, number> = { urgente: 0, atencion: 1, informativo: 2 };

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Hace unos minutos';
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Hace ${diffDays}d`;
}

export default function AdminAlertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('todas');
  const [resolveTarget, setResolveTarget] = useState<Alerta | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [notifyTarget, setNotifyTarget] = useState<Alerta | null>(null);
  const [notifyMessage, setNotifyMessage] = useState('');

  useEffect(() => {
    async function generateAlerts() {
      try {
        const generated: Alerta[] = [];
        let alertId = 0;

        // 1. Check documents with expiration dates
        const { data: docs } = await supabase
          .from('registration_documents')
          .select('document_name, fecha_vencimiento, validation_status, uploaded_at, registration_requests(razon_social, role)')
          .not('fecha_vencimiento', 'is', null);

        const today = new Date();
        if (docs) {
          for (const doc of docs) {
            const venc = new Date(doc.fecha_vencimiento!);
            const diffDays = Math.ceil((venc.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const empresa = (doc.registration_requests as any)?.razon_social || 'Empresa';

            if (diffDays < 0) {
              generated.push({
                id: String(++alertId), severidad: 'urgente',
                titulo: `${doc.document_name} vencido`,
                descripcion: `${empresa}: su ${doc.document_name.toLowerCase()} venció hace ${Math.abs(diffDays)} días. Perfil puede estar suspendido.`,
                entidad: empresa, entidadUrl: '/admin/recolectoras',
                tiempoTranscurrido: `Hace ${Math.abs(diffDays)}d`, resuelta: false,
              });
            } else if (diffDays <= 30) {
              generated.push({
                id: String(++alertId), severidad: 'atencion',
                titulo: `${doc.document_name} por vencer`,
                descripcion: `${empresa}: su ${doc.document_name.toLowerCase()} vence en ${diffDays} días.`,
                entidad: empresa, entidadUrl: '/admin/recolectoras',
                tiempoTranscurrido: `Vence en ${diffDays}d`, resuelta: false,
              });
            }
          }
        }

        // 2. Check pending registration requests
        const { data: pendingReqs } = await supabase
          .from('registration_requests')
          .select('razon_social, created_at, role')
          .in('status', ['pendiente', 'en_revision']);

        if (pendingReqs && pendingReqs.length > 0) {
          for (const req of pendingReqs) {
            const diffH = Math.floor((today.getTime() - new Date(req.created_at).getTime()) / (1000 * 60 * 60));
            if (diffH > 48) {
              generated.push({
                id: String(++alertId), severidad: 'atencion',
                titulo: 'Solicitud de registro sin revisar',
                descripcion: `${req.razon_social} lleva ${Math.floor(diffH / 24)} días esperando aprobación.`,
                entidad: req.razon_social, entidadUrl: '/admin/solicitudes',
                tiempoTranscurrido: timeAgo(req.created_at), resuelta: false,
              });
            }
          }
        }

        // 3. Check solicitudes without offers
        const { data: solicitudes } = await supabase
          .from('solicitudes_recoleccion')
          .select('id, created_at, direccion_recoleccion, status');

        const { data: ofertas } = await supabase
          .from('ofertas_recoleccion')
          .select('solicitud_id');

        if (solicitudes) {
          const ofertaSolIds = new Set(ofertas?.map(o => o.solicitud_id) || []);
          for (const sol of solicitudes) {
            if (sol.status === 'publicada' && !ofertaSolIds.has(sol.id)) {
              const diffH = Math.floor((today.getTime() - new Date(sol.created_at).getTime()) / (1000 * 60 * 60));
              if (diffH > 48) {
                generated.push({
                  id: String(++alertId), severidad: 'atencion',
                  titulo: 'Solicitud sin ofertas',
                  descripcion: `La solicitud en ${sol.direccion_recoleccion} lleva ${Math.floor(diffH / 24)} días publicada sin recibir ofertas.`,
                  entidad: `Solicitud ${sol.id.slice(0, 8)}`, entidadUrl: '/admin/todas-solicitudes',
                  tiempoTranscurrido: timeAgo(sol.created_at), resuelta: false,
                });
              }
            }
          }
        }

        // 4. Check for pending document validations
        const { data: pendingDocs } = await supabase
          .from('registration_documents')
          .select('document_name, uploaded_at, registration_requests(razon_social)')
          .eq('validation_status', 'pendiente');

        if (pendingDocs) {
          for (const doc of pendingDocs) {
            const empresa = (doc.registration_requests as any)?.razon_social || 'Empresa';
            generated.push({
              id: String(++alertId), severidad: 'informativo',
              titulo: 'Documento pendiente de revisión',
              descripcion: `${empresa} subió ${doc.document_name}. Pendiente de validación.`,
              entidad: empresa, entidadUrl: '/admin/solicitudes',
              tiempoTranscurrido: timeAgo(doc.uploaded_at), resuelta: false,
            });
          }
        }

        // If no alerts at all
        if (generated.length === 0) {
          generated.push({
            id: '0', severidad: 'informativo',
            titulo: 'Sin alertas',
            descripcion: 'No hay situaciones que requieran atención en este momento.',
            entidad: 'Sistema', entidadUrl: '/admin',
            tiempoTranscurrido: 'Ahora', resuelta: false,
          });
        }

        setAlertas(generated);
      } catch (err) {
        console.error('Error generating alerts:', err);
      } finally {
        setLoading(false);
      }
    }
    generateAlerts();
  }, []);

  const counts = useMemo(() => ({
    urgente: alertas.filter(a => !a.resuelta && a.severidad === 'urgente').length,
    atencion: alertas.filter(a => !a.resuelta && a.severidad === 'atencion').length,
    informativo: alertas.filter(a => !a.resuelta && a.severidad === 'informativo').length,
    resueltas: alertas.filter(a => a.resuelta).length,
  }), [alertas]);

  const filtered = useMemo(() => {
    let list = alertas;
    if (filter === 'resueltas') list = list.filter(a => a.resuelta);
    else if (filter !== 'todas') list = list.filter(a => !a.resuelta && a.severidad === filter);
    else list = list.filter(a => !a.resuelta);
    return [...list].sort((a, b) => {
      const sevDiff = sevOrder[a.severidad] - sevOrder[b.severidad];
      if (sevDiff !== 0) return sevDiff;
      return 0;
    });
  }, [alertas, filter]);

  const handleResolve = () => {
    if (!resolveNote.trim()) { toast.error('La nota de resolución es obligatoria'); return; }
    setAlertas(prev => prev.map(a => a.id === resolveTarget?.id ? { ...a, resuelta: true, notaResolucion: resolveNote } : a));
    toast.success('Alerta marcada como resuelta');
    setResolveTarget(null);
    setResolveNote('');
  };

  const handleNotify = () => {
    if (!notifyMessage.trim()) { toast.error('El mensaje es obligatorio'); return; }
    toast.success(`Notificación enviada a ${notifyTarget?.entidad}`);
    setNotifyTarget(null);
    setNotifyMessage('');
  };

  const filterButtons: { key: FilterType; label: string; count?: number; className: string }[] = [
    { key: 'todas', label: 'Todas', count: counts.urgente + counts.atencion + counts.informativo, className: 'border-border' },
    { key: 'urgente', label: 'Urgentes', count: counts.urgente, className: 'border-destructive/40 text-destructive' },
    { key: 'atencion', label: 'Atención', count: counts.atencion, className: 'border-amber-400 text-amber-700' },
    { key: 'informativo', label: 'Informativas', count: counts.informativo, className: 'border-accent/40 text-accent' },
    { key: 'resueltas', label: 'Resueltas', count: counts.resueltas, className: 'border-primary/30 text-primary' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold text-foreground">Alertas activas</h1>
        <p className="text-muted-foreground text-sm mt-1">Centro de control de riesgos de la plataforma</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterButtons.map(fb => (
          <button
            key={fb.key}
            onClick={() => setFilter(fb.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${fb.className} ${filter === fb.key ? 'bg-muted ring-1 ring-ring' : 'bg-card hover:bg-muted/50'}`}
          >
            {fb.label}
            {fb.count !== undefined && (
              <span className="h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-muted-foreground/10">
                {fb.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle className="h-10 w-10 mx-auto mb-3 text-primary/40" />
              <p className="font-medium">No hay alertas en esta categoría</p>
            </CardContent>
          </Card>
        )}
        {filtered.map(alerta => {
          const conf = sevConfig[alerta.severidad];
          const Icon = conf.icon;
          return (
            <Card key={alerta.id} className={`border-l-4 ${conf.borderClass} ${alerta.resuelta ? 'opacity-60' : ''}`}>
              <CardContent className={`p-4 ${!alerta.resuelta ? conf.bgClass : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="shrink-0 mt-0.5">
                    <Icon className={`h-5 w-5 ${alerta.severidad === 'urgente' ? 'text-destructive' : alerta.severidad === 'atencion' ? 'text-amber-500' : 'text-accent'}`} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`${conf.badgeClass} text-[10px] px-2 py-0`}>{conf.label}</Badge>
                      <h3 className="font-semibold text-sm text-foreground">{alerta.titulo}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{alerta.descripcion}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <a href={alerta.entidadUrl} className="font-medium text-primary hover:underline flex items-center gap-1">
                        <Shield className="h-3 w-3" /> {alerta.entidad}
                      </a>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {alerta.tiempoTranscurrido}</span>
                    </div>
                    {alerta.resuelta && alerta.notaResolucion && (
                      <p className="text-xs text-primary bg-primary/10 rounded px-2 py-1 mt-1">✓ Resuelta: {alerta.notaResolucion}</p>
                    )}
                  </div>
                  {!alerta.resuelta && (
                    <div className="flex gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                      <Button variant="outline" size="sm" asChild>
                        <a href={alerta.entidadUrl}><ExternalLink className="h-3.5 w-3.5 mr-1" /> Ir</a>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setNotifyTarget(alerta); setNotifyMessage(''); }}>
                        <Mail className="h-3.5 w-3.5 mr-1" /> Notificar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setResolveTarget(alerta); setResolveNote(''); }}>
                        <CheckCircle className="h-3.5 w-3.5 mr-1" /> Resolver
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!resolveTarget} onOpenChange={open => !open && setResolveTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Marcar alerta como resuelta</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{resolveTarget?.titulo}</span> — {resolveTarget?.entidad}</p>
            <div>
              <label className="text-sm font-medium text-foreground">Nota de resolución *</label>
              <Textarea placeholder="Describe cómo se resolvió esta alerta..." value={resolveNote} onChange={e => setResolveNote(e.target.value)} className="mt-1.5" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>Cancelar</Button>
            <Button onClick={handleResolve}><CheckCircle className="h-4 w-4 mr-1" /> Confirmar resolución</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!notifyTarget} onOpenChange={open => !open && setNotifyTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar notificación</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Destinatario: <span className="font-medium text-foreground">{notifyTarget?.entidad}</span></p>
            <div>
              <label className="text-sm font-medium text-foreground">Mensaje *</label>
              <Textarea placeholder="Escribe el mensaje..." value={notifyMessage} onChange={e => setNotifyMessage(e.target.value)} className="mt-1.5" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyTarget(null)}>Cancelar</Button>
            <Button onClick={handleNotify}><Mail className="h-4 w-4 mr-1" /> Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
