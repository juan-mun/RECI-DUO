import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ShieldCheck, AlertTriangle, XCircle, Clock, FileText, Upload, Eye, RefreshCw,
  Flame, Recycle, Cpu, Stethoscope, Leaf, Sparkles, FolderOpen
} from 'lucide-react';
import { format, differenceInDays, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

const REQUIRED_DOCS = [
  { name: 'Licencia Ambiental', key: 'licencia_ambiental', required: true, hasResolucion: true },
  { name: 'RUT', key: 'rut', required: true, hasResolucion: false },
  { name: 'Cámara de Comercio', key: 'camara_comercio', required: true, hasResolucion: false },
  { name: 'Registro RUA/RESPEL', key: 'registro_rua_respel', required: true, hasResolucion: false },
  { name: 'Plan de Manejo Ambiental', key: 'plan_manejo_ambiental', required: false, hasResolucion: false },
];

const CATEGORIAS_RESIDUOS = [
  { value: 'Peligroso RESPEL', icon: Flame, colorClass: 'bg-red-100 text-red-700' },
  { value: 'RCD', icon: Recycle, colorClass: 'bg-orange-100 text-orange-700' },
  { value: 'RAEE', icon: Cpu, colorClass: 'bg-blue-100 text-blue-700' },
  { value: 'Hospitalario', icon: Stethoscope, colorClass: 'bg-pink-100 text-pink-700' },
  { value: 'Orgánico', icon: Leaf, colorClass: 'bg-green-100 text-green-700' },
  { value: 'Especial', icon: Sparkles, colorClass: 'bg-purple-100 text-purple-700' },
];

type DocStatus = 'vigente' | 'por_vencer' | 'vencido' | 'pendiente' | 'no_subido';

function getDocStatus(doc: any): { status: DocStatus; daysLeft: number | null } {
  if (!doc) return { status: 'no_subido', daysLeft: null };
  if (doc.validation_status === 'pendiente') return { status: 'pendiente', daysLeft: null };
  if (!doc.fecha_vencimiento) return { status: 'vigente', daysLeft: null };
  const expiry = new Date(doc.fecha_vencimiento + 'T00:00:00');
  if (isPast(expiry)) return { status: 'vencido', daysLeft: 0 };
  const days = differenceInDays(expiry, new Date());
  if (days <= 30) return { status: 'por_vencer', daysLeft: days };
  return { status: 'vigente', daysLeft: days };
}

const STATUS_DISPLAY: Record<DocStatus, { label: string; icon: typeof ShieldCheck; badgeClass: string }> = {
  vigente: { label: 'Vigente ✓', icon: ShieldCheck, badgeClass: 'bg-green-100 text-green-800 border-green-200' },
  por_vencer: { label: 'Por vencer ⚠', icon: AlertTriangle, badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
  vencido: { label: 'Vencido ✗', icon: XCircle, badgeClass: 'bg-red-100 text-red-800 border-red-200' },
  pendiente: { label: 'Pendiente de revisión', icon: Clock, badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  no_subido: { label: 'No cargado', icon: FileText, badgeClass: 'bg-muted text-muted-foreground' },
};

export default function RecolectoraDocumentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [updateDoc, setUpdateDoc] = useState<{ name: string; key: string; docId?: string; requestId?: string } | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFechaVencimiento, setNewFechaVencimiento] = useState('');
  const [viewingUrl, setViewingUrl] = useState<string | null>(null);

  // Get registration request
  const { data: regRequest } = useQuery({
    queryKey: ['reg-request-docs', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('registration_requests')
        .select('id, numero_resolucion_licencia, autoridad_ambiental, razon_social, nit, representante_legal')
        .eq('user_id', user!.id)
        .eq('role', 'recolectora')
        .eq('status', 'aprobada')
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Get all documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['my-documents', user?.id, regRequest?.id],
    queryFn: async () => {
      if (!regRequest?.id) return [];
      const { data, error } = await supabase
        .from('registration_documents')
        .select('*')
        .eq('request_id', regRequest.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!regRequest?.id,
  });

  // Map documents by name/key
  const docsByName = useMemo(() => {
    const map: Record<string, any> = {};
    documents.forEach((d: any) => {
      const normalized = d.document_name?.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || '';
      map[normalized] = d;
      // Also map by raw name
      map[d.document_name] = d;
    });
    return map;
  }, [documents]);

  const findDoc = (key: string, name: string) => {
    return docsByName[key] || docsByName[name] || documents.find((d: any) =>
      d.document_name?.toLowerCase().includes(key.replace(/_/g, ' ')) ||
      d.document_name?.toLowerCase().includes(name.toLowerCase())
    );
  };

  // Compute alerts
  const alerts = useMemo(() => {
    const result: { type: 'warning' | 'danger'; message: string }[] = [];
    REQUIRED_DOCS.forEach((rd) => {
      const doc = findDoc(rd.key, rd.name);
      const { status, daysLeft } = getDocStatus(doc);
      if (status === 'por_vencer' && daysLeft !== null) {
        result.push({
          type: 'warning',
          message: `Tu ${rd.name} vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}. Actualízala para no perder visibilidad en la plataforma.`,
        });
      }
      if (status === 'vencido') {
        result.push({
          type: 'danger',
          message: `Tu ${rd.name} ha vencido. Tu perfil está suspendido hasta que el administrador apruebe tu nueva documentación.`,
        });
      }
    });
    return result;
  }, [documents]);

  // Get licencia doc for categorias
  const licenciaDoc = findDoc('licencia_ambiental', 'Licencia Ambiental');
  const categoriasAutorizadas: string[] = licenciaDoc?.categorias_autorizadas || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!newFile || !updateDoc || !regRequest?.id) throw new Error('Faltan datos');

      const sanitizedName = newFile.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user!.id}/${Date.now()}_${sanitizedName}`;
      const { error: uploadError } = await supabase.storage.from('registration-documents').upload(path, newFile);
      if (uploadError) throw uploadError;

      let docId: string | undefined = updateDoc.docId;

      if (updateDoc.docId) {
        const updates: any = {
          file_path: path,
          file_size: newFile.size,
          validation_status: 'pendiente',
          uploaded_at: new Date().toISOString(),
        };
        if (newFechaVencimiento) updates.fecha_vencimiento = newFechaVencimiento;
        const { error } = await supabase.from('registration_documents').update(updates).eq('id', updateDoc.docId);
        if (error) throw error;
      } else {
        const insertData: any = {
          request_id: regRequest.id,
          document_name: updateDoc.name,
          file_path: path,
          file_size: newFile.size,
          is_required: REQUIRED_DOCS.find((r) => r.key === updateDoc.key)?.required ?? true,
          validation_status: 'pendiente',
        };
        if (newFechaVencimiento) insertData.fecha_vencimiento = newFechaVencimiento;
        const { data: inserted, error } = await supabase.from('registration_documents').insert(insertData).select('id').single();
        if (error) throw error;
        docId = inserted?.id;
      }

      // AI validation (non-blocking)
      try {
        const fileToValidate = newFile;
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(fileToValidate);
        });

        const expectedFields = regRequest ? {
          razon_social: regRequest.razon_social,
          nit: regRequest.nit?.replace(/[^0-9]/g, ''),
          representante_legal: regRequest.representante_legal,
        } : undefined;

        const { data: aiData } = await supabase.functions.invoke('validate-kyb-document', {
          body: { file: base64, mimeType: fileToValidate.type, docType: updateDoc.key, expectedFields },
        });

        if (aiData?.extraction && docId) {
          await supabase
            .from('registration_documents')
            .update({
              ai_confidence: aiData.extraction.confidence,
              ai_anomalies: aiData.extraction.anomalies,
              ai_fields: aiData.extraction.fields,
              ai_validated_at: new Date().toISOString(),
            })
            .eq('id', docId);

          const { confidence, anomalies } = aiData.extraction;
          if (confidence >= 70 && (!anomalies || anomalies.length === 0)) {
            toast.success('Documento verificado por IA ✓');
          } else if (anomalies && anomalies.length > 0) {
            toast.warning(`Documento cargado con observaciones: ${anomalies[0]}`);
          } else if (confidence < 40) {
            toast.error('No se pudo verificar el documento — quedará en revisión manual');
          }
        }
      } catch (aiErr) {
        console.error('AI validation error:', aiErr);
        toast.warning('Documento cargado. La validación IA no pudo completarse.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-documents'] });
      toast.success('Documento cargado — pendiente de revisión por el administrador');
      setUpdateDoc(null);
      setNewFile(null);
      setNewFechaVencimiento('');
    },
    onError: (err: any) => toast.error(`Error al subir: ${err.message}`),
  });

  const handleViewDoc = async (doc: any) => {
    if (!doc?.file_path) return;
    const { data } = await supabase.storage.from('registration-documents').createSignedUrl(doc.file_path, 300);
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank');
    } else {
      toast.error('No se pudo generar la URL del documento');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alerts */}
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
            alert.type === 'danger'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {alert.type === 'danger' ? (
            <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          )}
          <p className="text-sm font-medium">{alert.message}</p>
        </div>
      ))}

      {/* Header */}
      <div>
        <h1 className="font-headline text-2xl font-bold">Mis Documentos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Documentos legales requeridos para operar como empresa recolectora de residuos.
        </p>
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        {REQUIRED_DOCS.map((rd) => {
          const doc = findDoc(rd.key, rd.name);
          const { status, daysLeft } = getDocStatus(doc);
          const display = STATUS_DISPLAY[status];
          const StatusIcon = display.icon;

          return (
            <Card key={rd.key}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{rd.name}</h3>
                      {!rd.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Opcional</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={display.badgeClass}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {display.label}
                      </Badge>
                      {doc?.fecha_vencimiento && status !== 'no_subido' && (
                        <span className="text-xs text-muted-foreground">
                          Vence: {format(new Date(doc.fecha_vencimiento + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}
                          {daysLeft !== null && status === 'por_vencer' && (
                            <span className="text-amber-600 font-medium ml-1">({daysLeft} días)</span>
                          )}
                        </span>
                      )}
                    </div>

                    {/* AI Validation Results */}
                    {doc?.ai_confidence !== undefined && doc?.ai_confidence !== null && (
                      <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">Confianza IA:</span>
                          <Progress
                            value={doc.ai_confidence}
                            className={`h-2 flex-1 max-w-[120px] ${
                              doc.ai_confidence >= 70 ? '[&>div]:bg-green-500' :
                              doc.ai_confidence >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                            }`}
                          />
                          <span className={`text-xs font-medium ${
                            doc.ai_confidence >= 70 ? 'text-green-700' :
                            doc.ai_confidence >= 40 ? 'text-amber-700' : 'text-red-700'
                          }`}>{doc.ai_confidence}%</span>
                        </div>
                        {doc.ai_anomalies && doc.ai_anomalies.length > 0 ? (
                          doc.ai_anomalies.map((anomaly: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs text-amber-700">
                              <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{anomaly}</span>
                            </div>
                          ))
                        ) : doc.ai_confidence >= 70 ? (
                          <div className="flex items-center gap-1.5 text-xs text-green-700">
                            <ShieldCheck className="h-3 w-3 shrink-0" />
                            <span>Sin observaciones ✓</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Extra info for Licencia */}
                    {rd.hasResolucion && regRequest && (
                      <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        {regRequest.numero_resolucion_licencia && (
                          <p>Resolución: <span className="font-medium text-foreground">{regRequest.numero_resolucion_licencia}</span></p>
                        )}
                        {regRequest.autoridad_ambiental && (
                          <p>Autoridad: <span className="font-medium text-foreground">{regRequest.autoridad_ambiental}</span></p>
                        )}
                      </div>
                    )}

                    {doc && (
                      <p className="text-[11px] text-muted-foreground">
                        Subido: {format(new Date(doc.uploaded_at), "d MMM yyyy", { locale: es })}
                        {doc.file_size ? ` · ${(doc.file_size / 1024).toFixed(0)} KB` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    {doc && (
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleViewDoc(doc)}>
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Button>
                    )}
                    <Button
                      variant={status === 'vencido' || status === 'no_subido' ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => setUpdateDoc({
                        name: rd.name,
                        key: rd.key,
                        docId: doc?.id,
                        requestId: regRequest?.id,
                      })}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      {status === 'no_subido' ? 'Cargar' : 'Actualizar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tipos de Residuos Autorizados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Tipos de Residuos Autorizados
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Categorías de residuos que tu licencia ambiental permite gestionar. Estas determinan qué solicitudes ves en la plataforma.
          </p>
        </CardHeader>
        <CardContent>
          {categoriasAutorizadas.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No se han configurado categorías autorizadas. Contacta al administrador para actualizar tu licencia.
              </p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIAS_RESIDUOS.filter((c) => categoriasAutorizadas.includes(c.value)).map((cat) => {
                const CatIcon = cat.icon;
                return (
                  <div key={cat.value} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${cat.colorClass}`}>
                    <CatIcon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{cat.value}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Show all categories if none configured */}
          {categoriasAutorizadas.length === 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Categorías disponibles en la plataforma:</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIAS_RESIDUOS.map((cat) => (
                  <span key={cat.value} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {cat.value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={!!updateDoc} onOpenChange={(v) => { if (!v) { setUpdateDoc(null); setNewFile(null); setNewFechaVencimiento(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {updateDoc?.docId ? 'Actualizar' : 'Cargar'} {updateDoc?.name}
            </DialogTitle>
            <DialogDescription>
              Sube la nueva versión del documento. Quedará en estado "Pendiente de revisión" hasta la aprobación del administrador.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Archivo *</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  id="doc-upload-input"
                  className="hidden"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="doc-upload-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click para seleccionar archivo</span>
                  <span className="text-xs text-muted-foreground">PDF, JPG o PNG</span>
                </label>
                {newFile && (
                  <p className="text-sm text-primary mt-3 font-medium">{newFile.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha de vencimiento</Label>
              <Input
                type="date"
                value={newFechaVencimiento}
                onChange={(e) => setNewFechaVencimiento(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Si el documento tiene vigencia, indica cuándo vence.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUpdateDoc(null); setNewFile(null); setNewFechaVencimiento(''); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!newFile || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Subiendo...' : 'Subir documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
