import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, ShieldCheck, Info, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const CATEGORIAS_FILTER = [
  { value: 'todos', label: 'Todas las categorías' },
  { value: 'Peligroso RESPEL', label: 'Peligroso RESPEL' },
  { value: 'RCD', label: 'RCD' },
  { value: 'RAEE', label: 'RAEE' },
  { value: 'Hospitalario', label: 'Hospitalario' },
  { value: 'Orgánico', label: 'Orgánico' },
  { value: 'Especial', label: 'Especial' },
];

type Certificado = {
  id: string;
  numero_certificado: string;
  tipo_residuo: string;
  categoria_residuo: string;
  cantidad_dispuesta: number;
  unidad: string;
  fecha_recoleccion: string;
  destino_final: string;
  codigo_verificacion: string;
  generadora_razon_social: string;
  generadora_nit: string;
  generadora_ciudad: string;
  generadora_representante: string;
  recolectora_razon_social: string;
  recolectora_nit: string;
  recolectora_licencia_ambiental: string | null;
  recolectora_autoridad_ambiental: string | null;
  created_at: string;
};

export default function GeneradoraCertificados() {
  const { user } = useAuth();
  const [selectedCert, setSelectedCert] = useState<Certificado | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  const { data: certificados = [], isLoading } = useQuery({
    queryKey: ['certificados', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificados')
        .select('*')
        .order('fecha_recoleccion', { ascending: false });
      if (error) throw error;
      return data as Certificado[];
    },
    enabled: !!user,
  });

  const filtered = certificados.filter((c) => {
    if (filtroCategoria !== 'todos' && c.categoria_residuo !== filtroCategoria) return false;
    if (filtroFechaDesde && c.fecha_recoleccion < filtroFechaDesde) return false;
    if (filtroFechaHasta && c.fecha_recoleccion > filtroFechaHasta) return false;
    return true;
  });

  const handleDownloadPDF = (cert: Certificado) => {
    // Generate a simple printable view
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>Certificado ${cert.numero_certificado}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #1a1a1a; }
        .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #16a34a; font-size: 24px; margin-bottom: 4px; }
        .header p { color: #666; font-size: 14px; }
        .cert-number { font-size: 18px; font-weight: bold; color: #333; margin: 16px 0; }
        .section { margin-bottom: 24px; }
        .section h2 { font-size: 16px; color: #16a34a; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-bottom: 12px; }
        .row { display: flex; margin-bottom: 8px; }
        .label { font-weight: bold; width: 220px; color: #555; }
        .value { flex: 1; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #888; }
        .qr-section { text-align: center; margin-top: 30px; padding: 20px; border: 1px dashed #ccc; border-radius: 8px; }
        .qr-code { font-family: monospace; font-size: 14px; letter-spacing: 2px; color: #333; background: #f5f5f5; padding: 8px 16px; border-radius: 4px; display: inline-block; }
        .legal { background: #f0fdf4; padding: 16px; border-radius: 8px; margin-top: 24px; font-size: 13px; color: #166534; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>
        <div class="header">
          <h1>RECI-DUO</h1>
          <p>Certificado de Disposición Final de Residuos</p>
          <div class="cert-number">N° ${cert.numero_certificado}</div>
        </div>

        <div class="section">
          <h2>Datos del Generador</h2>
          <div class="row"><span class="label">Razón Social:</span><span class="value">${cert.generadora_razon_social}</span></div>
          <div class="row"><span class="label">NIT:</span><span class="value">${cert.generadora_nit}</span></div>
          <div class="row"><span class="label">Ciudad:</span><span class="value">${cert.generadora_ciudad}</span></div>
          <div class="row"><span class="label">Representante Legal:</span><span class="value">${cert.generadora_representante}</span></div>
        </div>

        <div class="section">
          <h2>Datos del Recolector</h2>
          <div class="row"><span class="label">Razón Social:</span><span class="value">${cert.recolectora_razon_social}</span></div>
          <div class="row"><span class="label">NIT:</span><span class="value">${cert.recolectora_nit}</span></div>
          ${cert.recolectora_licencia_ambiental ? `<div class="row"><span class="label">Licencia Ambiental N°:</span><span class="value">${cert.recolectora_licencia_ambiental}</span></div>` : ''}
          ${cert.recolectora_autoridad_ambiental ? `<div class="row"><span class="label">Autoridad Ambiental:</span><span class="value">${cert.recolectora_autoridad_ambiental}</span></div>` : ''}
        </div>

        <div class="section">
          <h2>Información del Residuo</h2>
          <div class="row"><span class="label">Tipo de Residuo:</span><span class="value">${cert.tipo_residuo}</span></div>
          <div class="row"><span class="label">Categoría:</span><span class="value">${cert.categoria_residuo}</span></div>
          <div class="row"><span class="label">Cantidad Dispuesta:</span><span class="value">${cert.cantidad_dispuesta} ${cert.unidad}</span></div>
          <div class="row"><span class="label">Fecha de Recolección:</span><span class="value">${format(new Date(cert.fecha_recoleccion + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}</span></div>
          <div class="row"><span class="label">Destino Final:</span><span class="value">${cert.destino_final}</span></div>
        </div>

        <div class="qr-section">
          <p style="margin-bottom: 8px; font-weight: bold;">Código de Verificación</p>
          <div class="qr-code">${cert.codigo_verificacion}</div>
        </div>

        <div class="legal">
          Este certificado es válido ante la CAR y demás autoridades ambientales colombianas conforme a la normatividad vigente en materia de gestión integral de residuos.
        </div>

        <div class="footer">
          <p>Documento generado por RECI-DUO — Plataforma de Gestión de Residuos</p>
          <p>Fecha de emisión: ${format(new Date(cert.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</p>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
        <ShieldCheck className="h-5 w-5 text-green-700 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-green-800">Certificados con validez legal</p>
          <p className="text-sm text-green-700">
            Tus certificados son válidos ante la CAR y demás autoridades ambientales colombianas.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Certificados</h1>
          <p className="text-muted-foreground text-sm mt-1">Certificados de disposición final de residuos.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Categoría</Label>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_FILTER.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Desde</Label>
          <Input type="date" value={filtroFechaDesde} onChange={(e) => setFiltroFechaDesde(e.target.value)} className="w-[160px] h-9" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Hasta</Label>
          <Input type="date" value={filtroFechaHasta} onChange={(e) => setFiltroFechaHasta(e.target.value)} className="w-[160px] h-9" />
        </div>
        {(filtroCategoria !== 'todos' || filtroFechaDesde || filtroFechaHasta) && (
          <Button variant="ghost" size="sm" onClick={() => { setFiltroCategoria('todos'); setFiltroFechaDesde(''); setFiltroFechaHasta(''); }}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-headline text-xl font-semibold">
            {certificados.length === 0 ? 'No tienes certificados aún' : 'Sin resultados para estos filtros'}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {certificados.length === 0
              ? 'Los certificados se generarán automáticamente cuando se complete una recolección de residuos.'
              : 'Ajusta los filtros para encontrar los certificados que buscas.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Certificado</TableHead>
                <TableHead>Tipo de residuo</TableHead>
                <TableHead>Recolector</TableHead>
                <TableHead>Fecha recolección</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelectedCert(c)}>
                  <TableCell className="font-mono font-medium text-sm">{c.numero_certificado}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{c.tipo_residuo}</span>
                      <Badge variant="outline" className="ml-2 text-xs">{c.categoria_residuo}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{c.recolectora_razon_social}</TableCell>
                  <TableCell>{format(new Date(c.fecha_recoleccion + 'T00:00:00'), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{c.cantidad_dispuesta} {c.unidad}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={(e) => { e.stopPropagation(); handleDownloadPDF(c); }}
                    >
                      <Download className="h-3.5 w-3.5" /> PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Certificate detail modal */}
      <Dialog open={!!selectedCert} onOpenChange={(v) => { if (!v) setSelectedCert(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Certificado de Disposición Final
            </DialogTitle>
            <DialogDescription>
              N° {selectedCert?.numero_certificado}
            </DialogDescription>
          </DialogHeader>

          {selectedCert && (
            <div className="space-y-5">
              {/* Generador */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos del Generador</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Razón Social:</span></div>
                    <div className="font-medium">{selectedCert.generadora_razon_social}</div>
                    <div><span className="text-muted-foreground">NIT:</span></div>
                    <div className="font-medium">{selectedCert.generadora_nit}</div>
                    <div><span className="text-muted-foreground">Ciudad:</span></div>
                    <div className="font-medium">{selectedCert.generadora_ciudad}</div>
                    <div><span className="text-muted-foreground">Representante Legal:</span></div>
                    <div className="font-medium">{selectedCert.generadora_representante}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Recolector */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Datos del Recolector</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Razón Social:</span></div>
                    <div className="font-medium">{selectedCert.recolectora_razon_social}</div>
                    <div><span className="text-muted-foreground">NIT:</span></div>
                    <div className="font-medium">{selectedCert.recolectora_nit}</div>
                    {selectedCert.recolectora_licencia_ambiental && (
                      <>
                        <div><span className="text-muted-foreground">Licencia Ambiental N°:</span></div>
                        <div className="font-medium flex items-center gap-1">
                          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
                          {selectedCert.recolectora_licencia_ambiental}
                        </div>
                      </>
                    )}
                    {selectedCert.recolectora_autoridad_ambiental && (
                      <>
                        <div><span className="text-muted-foreground">Autoridad Ambiental:</span></div>
                        <div className="font-medium">{selectedCert.recolectora_autoridad_ambiental}</div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Residuo */}
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Información del Residuo</h3>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Tipo de Residuo:</span></div>
                    <div className="font-medium">{selectedCert.tipo_residuo}</div>
                    <div><span className="text-muted-foreground">Categoría:</span></div>
                    <div><Badge variant="outline">{selectedCert.categoria_residuo}</Badge></div>
                    <div><span className="text-muted-foreground">Cantidad Dispuesta:</span></div>
                    <div className="font-medium">{selectedCert.cantidad_dispuesta} {selectedCert.unidad}</div>
                    <div><span className="text-muted-foreground">Fecha de Recolección:</span></div>
                    <div className="font-medium">
                      {format(new Date(selectedCert.fecha_recoleccion + 'T00:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })}
                    </div>
                    <div><span className="text-muted-foreground">Destino Final:</span></div>
                    <div className="font-medium">{selectedCert.destino_final}</div>
                  </div>
                </CardContent>
              </Card>

              {/* QR / Verification */}
              <Card className="border-dashed">
                <CardContent className="pt-4 flex flex-col items-center space-y-2">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                  <p className="text-sm font-medium">Código de Verificación</p>
                  <code className="text-sm font-mono bg-muted px-3 py-1.5 rounded-md tracking-widest">
                    {selectedCert.codigo_verificacion}
                  </code>
                </CardContent>
              </Card>

              {/* Legal */}
              <div className="flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                <Info className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
                <p className="text-xs text-green-700">
                  Este certificado es válido ante la CAR y demás autoridades ambientales colombianas conforme a la normatividad vigente en materia de gestión integral de residuos.
                </p>
              </div>

              <Button className="w-full gap-2" onClick={() => handleDownloadPDF(selectedCert)}>
                <Download className="h-4 w-4" /> Descargar PDF
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
