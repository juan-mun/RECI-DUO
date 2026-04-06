import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Upload, X, FileText, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface RegisterFormProps {
  role: AppRole;
  onBack: () => void;
  onSuccess: () => void;
}

const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta',
  'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales',
  'Neiva', 'Villavicencio', 'Armenia', 'Valledupar', 'Montería', 'Sincelejo',
  'Popayán', 'Tunja', 'Florencia', 'Riohacha', 'Quibdó', 'Yopal',
  'Mocoa', 'Leticia', 'Inírida', 'Mitú', 'Puerto Carreño', 'San José del Guaviare',
];

interface DocSpec {
  name: string;
  required: boolean;
  tooltip?: string;
}

const DOCS_GENERADORA: DocSpec[] = [
  { name: 'RUT actualizado', required: true },
  { name: 'Cámara de Comercio (no mayor a 90 días)', required: true },
  { name: 'Cédula del representante legal', required: true },
  { name: 'Registro RUA/RESPEL', required: false, tooltip: 'Solo aplica si la empresa genera residuos peligrosos y está inscrita en el registro RESPEL del IDEAM' },
  { name: 'Certificado de separación en la fuente', required: false, tooltip: 'Documento que certifica que la empresa implementa separación de residuos en la fuente' },
];

const DOCS_RECOLECTORA: DocSpec[] = [
  { name: 'RUT actualizado', required: true },
  { name: 'Cámara de Comercio (no mayor a 90 días)', required: true },
  { name: 'Cédula del representante legal', required: true },
  { name: 'Licencia Ambiental vigente', required: true },
  { name: 'Plan de Manejo Ambiental (PMA)', required: false, tooltip: 'Documento que describe las medidas de manejo ambiental de la empresa' },
  { name: 'Certificado RESPEL del IDEAM', required: true },
];

function formatNIT(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function RegisterForm({ role, onBack, onSuccess }: RegisterFormProps) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const docs = role === 'generadora' ? DOCS_GENERADORA : DOCS_RECOLECTORA;

  const [form, setForm] = useState({
    razonSocial: '',
    nit: '',
    representante: '',
    email: '',
    telefono: '',
    ciudad: '',
    password: '',
    confirmPassword: '',
    adminPin: '',
    numeroResolucion: '',
    autoridadAmbiental: '',
    acceptTerms: false,
  });

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const set = (key: string, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.razonSocial.trim()) errs.razonSocial = 'Campo requerido';
    if (!form.nit.trim() || form.nit.replace(/\D/g, '').length < 9) errs.nit = 'NIT inválido';
    if (!form.representante.trim()) errs.representante = 'Campo requerido';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Correo inválido';
    if (!form.telefono.trim()) errs.telefono = 'Campo requerido';
    if (!form.ciudad) errs.ciudad = 'Selecciona una ciudad';
    if (form.password.length < 8) errs.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Las contraseñas no coinciden';
    // admin role is not registerable
    if (role === 'recolectora' && !form.numeroResolucion.trim()) errs.numeroResolucion = 'Campo requerido';
    if (!form.acceptTerms) errs.acceptTerms = 'Debes aceptar los términos';

    docs.forEach((d) => {
      if (d.required && !files[d.name]) {
        errs[`doc_${d.name}`] = 'Documento requerido';
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await signUp(form.email, form.password);
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('No se pudo crear el usuario');

      const userId = signUpData.user.id;

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: userId,
        razon_social: form.razonSocial,
        nit: form.nit,
        representante_legal: form.representante,
        email_corporativo: form.email,
        telefono: form.telefono,
        ciudad: form.ciudad,
      });
      if (profileError) throw profileError;

      // Create registration request
      const { data: reqData, error: reqError } = await supabase.from('registration_requests').insert({
        user_id: userId,
        role,
        razon_social: form.razonSocial,
        nit: form.nit,
        representante_legal: form.representante,
        email_corporativo: form.email,
        telefono: form.telefono,
        ciudad: form.ciudad,
        numero_resolucion_licencia: form.numeroResolucion || null,
        autoridad_ambiental: form.autoridadAmbiental || null,
      }).select('id').single();
      if (reqError) throw reqError;

      // Upload documents
      const uploadErrors: string[] = [];
      for (const [docName, file] of Object.entries(files)) {
        if (!file) continue;
        try {
          const ext = file.name.split('.').pop() || 'pdf';
          const safeName = docName
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
          const filePath = `${userId}/${reqData.id}/${safeName}_${Date.now()}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from('registration-documents')
            .upload(filePath, file, { contentType: file.type });
          if (uploadErr) {
            uploadErrors.push(`${docName}: ${uploadErr.message}`);
            continue;
          }

          const docSpec = docs.find((d) => d.name === docName);
          const { data: inserted, error: insertErr } = await supabase.from('registration_documents').insert({
            request_id: reqData.id,
            document_name: docName,
            file_path: filePath,
            file_size: file.size,
            is_required: docSpec?.required ?? true,
          }).select('id').single();
          if (insertErr) throw insertErr;

          // AI validation (non-blocking)
          try {
            const docTypeMap: Record<string, string> = {
              'RUT actualizado': 'rut',
              'Cámara de Comercio (no mayor a 90 días)': 'camara_comercio',
              'Cédula del representante legal': 'cedula',
              'Licencia Ambiental vigente': 'licencia_ambiental',
              'Plan de Manejo Ambiental (PMA)': 'plan_manejo_ambiental',
              'Certificado RESPEL del IDEAM': 'registro_rua_respel',
              'RUT': 'rut',
              'Cámara de Comercio': 'camara_comercio',
              'Cédula representante legal': 'cedula',
            };
            const docType = docTypeMap[docName] || 'otro';

            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve((reader.result as string).split(',')[1]);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });

            const expectedFields = {
              razon_social: form.razonSocial,
              nit: form.nit.replace(/[^0-9]/g, ''),
              representante_legal: form.representante,
            };

            const { data: aiData } = await supabase.functions.invoke('validate-kyb-document', {
              body: { file: base64, mimeType: file.type, docType, expectedFields },
            });

            if (aiData?.extraction && inserted?.id) {
              await supabase.from('registration_documents').update({
                ai_confidence: aiData.extraction.confidence,
                ai_anomalies: aiData.extraction.anomalies,
                ai_fields: aiData.extraction.fields,
                ai_validated_at: new Date().toISOString(),
              }).eq('id', inserted.id);
            }
          } catch (aiErr) {
            console.error('AI validation error for', docName, aiErr);
          }
        } catch (docErr) {
          uploadErrors.push(`${docName}: error inesperado`);
        }
      }
      if (uploadErrors.length > 0) {
        toast({
          title: 'Advertencia',
          description: `Algunos documentos no se subieron: ${uploadErrors.join(', ')}`,
          variant: 'destructive',
        });
      }

      // Sign out after registration (admin must approve)
      await supabase.auth.signOut();
      onSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = (docName: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      setFiles((f) => ({ ...f, [docName]: file }));
      setErrors((errs) => ({ ...errs, [`doc_${docName}`]: '' }));
    }
  };

  const roleLabel = role === 'generadora' ? 'Empresa Generadora' : role === 'recolectora' ? 'Empresa Recolectora' : 'Administrador';

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-1 text-sm mb-3 hover:underline" style={{ color: 'hsl(var(--hero-muted))' }}>
          <ArrowLeft className="h-4 w-4" /> Cambiar rol
        </button>
        <h1 className="font-headline text-xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
          Registro — {roleLabel}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

        {/* Form fields - 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Razón social de la empresa" error={errors.razonSocial}>
            <Input value={form.razonSocial} onChange={(e) => set('razonSocial', e.target.value)} placeholder="Mi Empresa S.A.S." />
          </Field>

          <Field label="NIT" error={errors.nit}>
            <Input value={form.nit} onChange={(e) => set('nit', formatNIT(e.target.value))} placeholder="900.123.456-7" />
          </Field>

          <Field label="Nombre del representante legal" error={errors.representante}>
            <Input value={form.representante} onChange={(e) => set('representante', e.target.value)} placeholder="Juan Pérez" />
          </Field>

          <Field label="Correo electrónico corporativo" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contacto@empresa.com" />
          </Field>

          <Field label="Teléfono de contacto" error={errors.telefono}>
            <Input type="tel" value={form.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="+57 300 123 4567" />
          </Field>

          <Field label="Ciudad" error={errors.ciudad}>
            <select
              value={form.ciudad}
              onChange={(e) => set('ciudad', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Seleccionar ciudad</option>
              {COLOMBIAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="Contraseña" error={errors.password}>
            <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Mínimo 8 caracteres" />
          </Field>

          <Field label="Confirmar contraseña" error={errors.confirmPassword}>
            <Input type="password" value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repite tu contraseña" />
          </Field>
        </div>

        {/* Recolectora extra fields */}
        {role === 'recolectora' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Número de resolución de licencia" error={errors.numeroResolucion}>
              <Input value={form.numeroResolucion} onChange={(e) => set('numeroResolucion', e.target.value)} placeholder="0150-0231-2017" />
            </Field>
            <Field label="Autoridad ambiental" error={errors.autoridadAmbiental}>
              <select
                value={form.autoridadAmbiental}
                onChange={(e) => set('autoridadAmbiental', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Seleccionar</option>
                {['ANLA', 'CAR Cundinamarca', 'SDA Bogotá', 'CORNARE', 'CVC', 'CDMB', 'CORPOBOYACÁ', 'Otra'].map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* Document upload section */}
        <div>
          <h3 className="font-headline text-lg font-bold mb-4" style={{ color: 'hsl(var(--hero-headline))' }}>
            Documentos requeridos
          </h3>
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.name}
                className={`rounded-xl border-2 border-dashed p-4 transition-colors ${
                  dragOver === doc.name ? 'border-primary bg-primary/5' : 
                  errors[`doc_${doc.name}`] ? 'border-destructive/50 bg-destructive/5' : 
                  files[doc.name] ? 'border-primary/30 bg-primary/5' : 'border-border'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(doc.name); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleFileDrop(doc.name, e)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-5 w-5 shrink-0" style={{ color: files[doc.name] ? 'hsl(var(--hero-green))' : 'hsl(var(--hero-muted))' }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate" style={{ color: 'hsl(var(--hero-headline))' }}>
                          {doc.name}
                        </span>
                        {!doc.required && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">Opcional</span>
                        )}
                        {doc.tooltip && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs"><p>{doc.tooltip}</p></TooltipContent>
                          </Tooltip>
                        )}
                        {doc.required && role === 'recolectora' && doc.name === 'Licencia Ambiental vigente' && (
                          <span className="text-xs px-1.5 py-0.5 rounded shrink-0" style={{ background: 'hsl(0, 84%, 95%)', color: 'hsl(0, 84%, 40%)' }}>
                            Obligatorio
                          </span>
                        )}
                      </div>
                      {files[doc.name] && (
                        <span className="text-xs text-muted-foreground truncate block">
                          {files[doc.name]!.name} ({(files[doc.name]!.size / 1024).toFixed(0)} KB)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {files[doc.name] ? (
                      <>
                        <span className="text-xs font-medium" style={{ color: 'hsl(var(--hero-green))' }}>Cargado</span>
                        <button
                          type="button"
                          onClick={() => setFiles((f) => ({ ...f, [doc.name]: null }))}
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFiles((f) => ({ ...f, [doc.name]: file }));
                              setErrors((errs) => ({ ...errs, [`doc_${doc.name}`]: '' }));
                            }
                          }}
                        />
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-full border border-border hover:bg-muted transition-colors">
                          <Upload className="h-3 w-3" /> Cargar
                        </span>
                      </label>
                    )}
                  </div>
                </div>
                {errors[`doc_${doc.name}`] && (
                  <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors[`doc_${doc.name}`]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms"
            checked={form.acceptTerms}
            onCheckedChange={(v) => set('acceptTerms', !!v)}
          />
          <label htmlFor="terms" className="text-sm leading-tight cursor-pointer" style={{ color: 'hsl(var(--hero-subtitle))' }}>
            Acepto los <a href="#" className="text-primary hover:underline">Términos y condiciones</a> y la <a href="#" className="text-primary hover:underline">Política de tratamiento de datos personales</a>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {errors.acceptTerms}
          </p>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-[50px] h-12 text-base"
          style={{ background: 'hsl(var(--hero-headline))' }}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground" />
          ) : (
            'Enviar solicitud de registro'
          )}
        </Button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block" style={{ color: 'hsl(var(--hero-subtitle))' }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
