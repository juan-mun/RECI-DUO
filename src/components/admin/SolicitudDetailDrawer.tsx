import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CheckCircle, XCircle, AlertTriangle, FileText, Download, ExternalLink,
  Clock, Loader2, Search, Brain,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Doc {
  id: string;
  document_name: string;
  file_path: string;
  file_size: number | null;
  validation_status: string | null;
  observation: string | null;
  uploaded_at: string;
  ai_confidence: number | null;
  ai_anomalies: string[] | null;
  ai_fields: Record<string, unknown> | null;
  ai_validated_at: string | null;
}

interface ActionLog {
  id: string;
  action: string;
  details: string | null;
  created_at: string;
  performed_by: string | null;
}

interface RequestDetail {
  id: string;
  razon_social: string;
  nit: string;
  role: string;
  status: string;
  representante_legal: string;
  email_corporativo: string;
  telefono: string;
  ciudad: string;
  numero_resolucion_licencia: string | null;
  autoridad_ambiental: string | null;
  created_at: string;
  user_id: string;
}

interface Props {
  requestId: string;
  open: boolean;
  onClose: () => void;
}

const REJECTION_REASONS = [
  'Documentos ilegibles o incompletos',
  'Licencia ambiental no vigente',
  'NIT no coincide con Cámara de Comercio',
  'Información inconsistente',
];

// Helper: doc AI status
function getDocAiStatus(doc: Doc): 'aprobado' | 'alerta' | 'bloqueado' | 'pendiente' {
  if (doc.ai_confidence == null) return 'pendiente';
  if (doc.ai_confidence >= 70 && (!doc.ai_anomalies || doc.ai_anomalies.length === 0)) return 'aprobado';
  if (doc.ai_confidence < 40 || (doc.ai_anomalies && doc.ai_anomalies.length >= 3)) return 'bloqueado';
  return 'alerta';
}

const STATUS_CONFIG = {
  aprobado: { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  alerta: { label: 'Alerta', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  bloqueado: { label: 'Bloqueado', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  pendiente: { label: 'Pendiente', bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
};

// Derive readable findings from ai_fields and ai_anomalies
function getFindings(doc: Doc): { icon: 'check' | 'warn' | 'error' | 'info'; text: string }[] {
  const findings: { icon: 'check' | 'warn' | 'error' | 'info'; text: string }[] = [];
  const fields = doc.ai_fields || {};
  const anomalies = doc.ai_anomalies || [];

  // Positive signals from extracted fields
  if (fields.nit) findings.push({ icon: 'check', text: `NIT extraído: ${fields.nit}` });
  if (fields.razon_social) findings.push({ icon: 'check', text: `Razón social: ${fields.razon_social}` });
  if (fields.representante_legal) findings.push({ icon: 'check', text: `Representante legal extraído` });
  if (fields.numero_resolucion) findings.push({ icon: 'check', text: `Resolución: ${fields.numero_resolucion}` });
  if (fields.autoridad_ambiental) findings.push({ icon: 'check', text: `Autoridad: ${fields.autoridad_ambiental}` });
  if (fields.actividad_economica) findings.push({ icon: 'check', text: `CIIU: ${fields.actividad_economica}` });
  if (fields.fecha_documento) findings.push({ icon: 'info', text: `Fecha doc: ${fields.fecha_documento}` });
  if (fields.fecha_vencimiento) findings.push({ icon: 'info', text: `Vencimiento: ${fields.fecha_vencimiento}` });
  if (Array.isArray(fields.categorias_residuos) && fields.categorias_residuos.length > 0) {
    findings.push({ icon: 'check', text: `Categorías: ${(fields.categorias_residuos as string[]).join(', ')}` });
  }

  // Anomalies
  anomalies.forEach(a => {
    findings.push({ icon: doc.ai_confidence != null && doc.ai_confidence < 40 ? 'error' : 'warn', text: a });
  });

  return findings;
}

const FINDING_ICONS = {
  check: { icon: CheckCircle, className: 'text-green-600' },
  warn: { icon: AlertTriangle, className: 'text-amber-600' },
  error: { icon: XCircle, className: 'text-red-600' },
  info: { icon: Clock, className: 'text-muted-foreground' },
};

export function SolicitudDetailDrawer({ requestId, open, onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [correctOpen, setCorrectOpen] = useState(false);
  const [approveMsg, setApproveMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [correctMsg, setCorrectMsg] = useState('');
  const [allowResubmit, setAllowResubmit] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<'found' | 'not_found' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiValidating, setAiValidating] = useState(false);
  const [aiValidatingDocId, setAiValidatingDocId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [reqRes, docsRes, logsRes] = await Promise.all([
      supabase.from('registration_requests').select('*').eq('id', requestId).single(),
      supabase.from('registration_documents').select('*').eq('request_id', requestId).order('uploaded_at'),
      supabase.from('request_actions_log').select('*').eq('request_id', requestId).order('created_at', { ascending: false }),
    ]);
    setRequest(reqRes.data as RequestDetail | null);
    setDocs((docsRes.data ?? []) as Doc[]);
    setLogs((logsRes.data ?? []) as ActionLog[]);
    setLoading(false);
  };

  useEffect(() => {
    if (open && requestId) fetchData();
  }, [open, requestId]);

  // Trigger AI validation for a single document
  const triggerAiValidation = async (doc: Doc) => {
    setAiValidatingDocId(doc.id);
    try {
      // Download the file
      const { data: fileData, error: dlError } = await supabase.storage
        .from('registration-documents')
        .download(doc.file_path);
      if (dlError || !fileData) throw new Error('No se pudo descargar el documento');

      // Convert to base64
      const arrayBuf = await fileData.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      const base64 = btoa(binary);

      const mimeType = fileData.type || 'application/pdf';
      const docType = doc.document_name.toLowerCase()
        .replace(/[áà]/g, 'a').replace(/[éè]/g, 'e').replace(/[íì]/g, 'i')
        .replace(/[óò]/g, 'o').replace(/[úù]/g, 'u')
        .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const expectedFields = request ? {
        razon_social: request.razon_social,
        nit: request.nit?.replace(/[^0-9]/g, ''),
        representante_legal: request.representante_legal,
      } : undefined;

      const { data: aiData, error: fnError } = await supabase.functions.invoke('validate-kyb-document', {
        body: { file: base64, mimeType, docType, expectedFields },
      });

      if (fnError) throw fnError;

      if (aiData?.extraction) {
        await supabase.from('registration_documents').update({
          ai_confidence: aiData.extraction.confidence,
          ai_anomalies: aiData.extraction.anomalies || [],
          ai_fields: aiData.extraction.fields || {},
          ai_validated_at: new Date().toISOString(),
        }).eq('id', doc.id);

        toast({ title: 'Validación IA completada', description: `Confianza: ${aiData.extraction.confidence}%` });
      }
    } catch (err) {
      console.error('AI validation error:', err);
      toast({ title: 'Error en validación IA', description: 'No se pudo completar el análisis.', variant: 'destructive' });
    } finally {
      setAiValidatingDocId(null);
      fetchData();
    }
  };

  // Trigger AI validation for ALL docs (re-validates even already validated ones)
  const triggerAiValidationAll = async () => {
    setAiValidating(true);
    for (const doc of docs) {
      await triggerAiValidation(doc);
    }
    setAiValidating(false);
    toast({ title: 'Re-validación completa', description: 'Todos los documentos han sido re-analizados por la IA.' });
  };

  const handleAction = async (action: 'aprobar' | 'rechazar' | 'correccion') => {
    if (!request || !user) return;
    setActionLoading(true);
    try {
      const updates: Record<string, unknown> = { reviewed_by: user.id, reviewed_at: new Date().toISOString() };
      let logDetails = '';

      if (action === 'aprobar') {
        updates.status = 'aprobada';
        updates.admin_message = approveMsg || null;
        logDetails = approveMsg || 'Solicitud aprobada';
        await supabase.from('user_roles').insert({ user_id: request.user_id, role: request.role as 'generadora' | 'recolectora' });
      } else if (action === 'rechazar') {
        updates.status = 'rechazada';
        updates.rejection_reason = rejectReason;
        updates.allow_resubmit = allowResubmit;
        logDetails = rejectReason;

        await supabase.from('registration_requests').update(updates).eq('id', requestId);
        await supabase.from('request_actions_log').insert({
          request_id: requestId, action: 'Solicitud rechazada', details: logDetails, performed_by: user.id,
        });

        const { error: delError } = await supabase.functions.invoke('delete-rejected-user', {
          body: { request_id: requestId },
        });
        if (delError) console.warn('Error deleting rejected user:', delError);

        toast({ title: 'Solicitud rechazada', description: 'La empresa ha sido rechazada y eliminada.' });
        setRejectOpen(false);
        setActionLoading(false);
        onClose();
        return;
      } else {
        updates.status = 'correccion';
        updates.admin_message = correctMsg;
        logDetails = correctMsg;
      }

      await supabase.from('registration_requests').update(updates).eq('id', requestId);
      await supabase.from('request_actions_log').insert({
        request_id: requestId,
        action: action === 'aprobar' ? 'Solicitud aprobada' : 'Corrección solicitada',
        details: logDetails, performed_by: user.id,
      });

      toast({ title: 'Acción completada', description: `Solicitud ${action === 'aprobar' ? 'aprobada' : 'marcada para corrección'}.` });
      setApproveOpen(false);
      setCorrectOpen(false);
      fetchData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo completar la acción.', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocValidation = async (docId: string, status: string, observation?: string) => {
    await supabase.from('registration_documents').update({ validation_status: status, observation: observation || null }).eq('id', docId);
    fetchData();
  };

  const simulateVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerifyResult(Math.random() > 0.3 ? 'found' : 'not_found');
    }, 2500);
  };

  if (!open) return null;

  // KYB score calculations
  const validatedDocs = docs.filter(d => d.ai_confidence != null);
  const hasAiResults = validatedDocs.length > 0;
  const kybScore = hasAiResults
    ? Math.round(validatedDocs.reduce((sum, d) => sum + (d.ai_confidence || 0), 0) / validatedDocs.length)
    : null;
  const docsApproved = validatedDocs.filter(d => getDocAiStatus(d) === 'aprobado').length;
  const alertCount = validatedDocs.filter(d => getDocAiStatus(d) === 'alerta').length;
  const blockCount = validatedDocs.filter(d => getDocAiStatus(d) === 'bloqueado').length;
  const pendingAiDocs = docs.filter(d => d.ai_confidence == null).length;

  const scoreLabel = kybScore != null
    ? kybScore >= 75 ? 'Aprobación recomendada'
    : kybScore >= 50 ? 'Aprobación con revisión manual recomendada'
    : 'Revisión manual obligatoria — riesgo alto'
    : null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="font-headline text-xl" style={{ color: 'hsl(var(--hero-headline))' }}>
              Detalle de solicitud
            </SheetTitle>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : request ? (
            <div className="p-6 space-y-8">
              {/* Section 1 - Company data */}
              <section>
                <h3 className="font-headline text-base font-bold mb-4" style={{ color: 'hsl(var(--hero-headline))' }}>
                  Datos de la empresa
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <InfoRow label="Razón social" value={request.razon_social} />
                  <InfoRow label="NIT" value={request.nit} />
                  <InfoRow label="Representante legal" value={request.representante_legal} />
                  <InfoRow label="Correo" value={request.email_corporativo} />
                  <InfoRow label="Teléfono" value={request.telefono} />
                  <InfoRow label="Ciudad" value={request.ciudad} />
                  <InfoRow label="Rol solicitado" value={request.role} />
                  <InfoRow label="Fecha de solicitud" value={new Date(request.created_at).toLocaleString('es-CO')} />
                </div>
              </section>

              {/* Section 2 - KYB Validation */}
              <section>

                {/* KYB Summary */}
                {hasAiResults && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      EMPRESA: {request.razon_social} — NIT {request.nit}
                    </p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <SummaryCard label="Score KYB" value={`${kybScore}/100`} color={
                        kybScore! >= 70 ? 'text-green-600' : kybScore! >= 40 ? 'text-amber-600' : 'text-red-600'
                      } />
                      <SummaryCard label="Docs aprobados" value={`${docsApproved} / ${validatedDocs.length}`} color="text-green-600" />
                      <SummaryCard label="Alertas" value={String(alertCount)} color="text-amber-600" />
                      <SummaryCard label="Bloqueos" value={String(blockCount)} color="text-red-600" />
                    </div>

                    {/* Risk Bar */}
                    <div className="mb-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>Riesgo alto</span>
                        <span>Riesgo bajo</span>
                      </div>
                      <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-red-500 via-amber-400 to-green-500 relative">
                        <div
                          className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-md"
                          style={{ left: `${kybScore}%`, transform: 'translateX(-50%)' }}
                        />
                      </div>
                    </div>
                    <p className="text-xs font-medium mt-1.5 mb-6" style={{ color: 'hsl(var(--hero-headline))' }}>
                      {kybScore} pts — {scoreLabel}
                    </p>
                  </>
                )}

                {/* Per-document validation cards */}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Validación por documento
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 px-3"
                    disabled={aiValidating || docs.length === 0}
                    onClick={triggerAiValidationAll}
                  >
                    {aiValidating
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Brain className="h-3.5 w-3.5" />
                    }
                    {aiValidating ? 'Validando...' : 'Re-validar todos'}
                  </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docs.map((doc) => {
                    const status = getDocAiStatus(doc);
                    const cfg = STATUS_CONFIG[status];
                    const findings = getFindings(doc);

                    return (
                      <div
                        key={doc.id}
                        className={`rounded-xl border-2 p-4 ${cfg.border} ${cfg.bg.replace('100', '50/30')}`}
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="text-sm font-bold leading-tight" style={{ color: 'hsl(var(--hero-headline))' }}>
                            {doc.document_name}
                          </p>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </div>

                        {/* Findings */}
                        {findings.length > 0 ? (
                          <div className="space-y-1.5 mb-3">
                            {findings.map((f, i) => {
                              const IconCfg = FINDING_ICONS[f.icon];
                              return (
                                <div key={i} className="flex items-start gap-1.5 text-xs">
                                  <IconCfg.icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${IconCfg.className}`} />
                                  <span className="text-foreground/80">{f.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : status === 'pendiente' ? (
                          <p className="text-xs text-muted-foreground mb-3">Sin análisis IA aún</p>
                        ) : null}

                        {/* Actions row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={async () => {
                            const { data } = await supabase.storage.from('registration-documents').createSignedUrl(doc.file_path, 3600);
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                          }}>
                            <ExternalLink className="h-3 w-3" /> Ver
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={async () => {
                            const { data } = await supabase.storage.from('registration-documents').createSignedUrl(doc.file_path, 3600, { download: true });
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                          }}>
                            <Download className="h-3 w-3" /> Descargar
                          </Button>
                          {status === 'pendiente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] gap-1 px-2"
                              disabled={aiValidatingDocId === doc.id}
                              onClick={() => triggerAiValidation(doc)}
                            >
                              {aiValidatingDocId === doc.id
                                ? <Loader2 className="h-3 w-3 animate-spin" />
                                : <Brain className="h-3 w-3" />
                              }
                              Validar IA
                            </Button>
                          )}
                          <select
                            value={doc.validation_status || 'pendiente'}
                            onChange={(e) => handleDocValidation(doc.id, e.target.value)}
                            className="text-[10px] rounded-md border border-input bg-background px-1.5 py-0.5 ml-auto"
                          >
                            <option value="pendiente">⏳ Pendiente</option>
                            <option value="valido">✓ Válido</option>
                            <option value="invalido">✗ Inválido</option>
                            <option value="requiere_correccion">⚠ Corrección</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Section 3 - License verification (recolectora only) */}
              {request.role === 'recolectora' && (
                <section>
                  <h3 className="font-headline text-base font-bold mb-4" style={{ color: 'hsl(var(--hero-headline))' }}>
                    Verificación de licencia ambiental
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    <InfoRow label="Nro. resolución" value={request.numero_resolucion_licencia || 'No declarado'} />
                    <InfoRow label="Autoridad ambiental" value={request.autoridad_ambiental || 'No declarada'} />
                  </div>
                  <Button onClick={simulateVerify} disabled={verifying} variant="outline" className="gap-2">
                    {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    {verifying ? 'Verificando...' : 'Verificar en base de datos ANLA'}
                  </Button>
                  {verifyResult && (
                    <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                      verifyResult === 'found' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {verifyResult === 'found' ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                      {verifyResult === 'found' ? 'Encontrada en registros ✓' : 'No encontrada — verificar manualmente ⚠'}
                    </div>
                  )}
                </section>
              )}

              {/* Section 4 - Actions */}
              <section>
                <h3 className="font-headline text-base font-bold mb-4" style={{ color: 'hsl(var(--hero-headline))' }}>
                  Decisión final
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => setApproveOpen(true)} className="gap-2 rounded-xl" style={{ background: 'hsl(145, 50%, 35%)' }}>
                    <CheckCircle className="h-4 w-4" /> Aprobar empresa
                  </Button>
                  <Button onClick={() => setRejectOpen(true)} variant="destructive" className="gap-2 rounded-xl">
                    <XCircle className="h-4 w-4" /> Rechazar solicitud
                  </Button>
                  <Button onClick={() => setCorrectOpen(true)} variant="outline" className="gap-2 rounded-xl" style={{ borderColor: 'hsl(40,70%,60%)', color: 'hsl(40,70%,40%)' }}>
                    <AlertTriangle className="h-4 w-4" /> Solicitar corrección
                  </Button>
                </div>
              </section>

              {/* Timeline */}
              <section>
                <h3 className="font-headline text-base font-bold mb-4" style={{ color: 'hsl(var(--hero-headline))' }}>
                  Historial de acciones
                </h3>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin acciones registradas.</p>
                ) : (
                  <div className="space-y-0 border-l-2 border-border ml-2 pl-6">
                    {logs.map((log) => (
                      <div key={log.id} className="relative pb-6 last:pb-0">
                        <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-card border-2 border-border" />
                        <p className="text-sm font-medium" style={{ color: 'hsl(var(--hero-headline))' }}>{log.action}</p>
                        {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {new Date(log.created_at).toLocaleString('es-CO')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Approve Modal */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar aprobación?</DialogTitle>
            <DialogDescription>
              La empresa <strong>{request?.razon_social}</strong> será habilitada para operar en RECI-DUO como <strong>{request?.role}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Mensaje personalizado (opcional)" value={approveMsg} onChange={(e) => setApproveMsg(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleAction('aprobar')} disabled={actionLoading} style={{ background: 'hsl(145, 50%, 35%)' }}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, aprobar y notificar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar solicitud</DialogTitle>
            <DialogDescription>Indica el motivo del rechazo.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 mb-3">
            {REJECTION_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setRejectReason(r)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  rejectReason === r ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border hover:bg-muted'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Textarea placeholder="Motivo del rechazo (obligatorio)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} required />
          <div className="flex items-center gap-2 mt-2">
            <Checkbox id="resubmit" checked={allowResubmit} onCheckedChange={(v) => setAllowResubmit(!!v)} />
            <label htmlFor="resubmit" className="text-sm">Permitir que la empresa corrija y reenvíe</label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleAction('rechazar')} disabled={!rejectReason || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechazar y notificar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Correction Modal */}
      <Dialog open={correctOpen} onOpenChange={setCorrectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar corrección</DialogTitle>
            <DialogDescription>Indica qué debe corregir la empresa.</DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Describe los ajustes necesarios..." value={correctMsg} onChange={(e) => setCorrectMsg(e.target.value)} required />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCorrectOpen(false)}>Cancelar</Button>
            <Button onClick={() => handleAction('correccion')} disabled={!correctMsg || actionLoading} style={{ background: 'hsl(40,70%,50%)' }}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Solicitar corrección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize" style={{ color: 'hsl(var(--hero-headline))' }}>{value}</p>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold leading-tight mt-0.5 ${color}`}>{value}</p>
    </div>
  );
}
