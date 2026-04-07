import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search, Award, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Certificado {
  id: string;
  numero_certificado: string;
  generadora_razon_social: string;
  generadora_nit: string;
  generadora_ciudad: string;
  recolectora_razon_social: string;
  recolectora_nit: string;
  tipo_residuo: string;
  categoria_residuo: string;
  cantidad_dispuesta: number;
  unidad: string;
  fecha_recoleccion: string;
  destino_final: string;
  codigo_verificacion: string;
  created_at: string;
}

export default function AdminTodosCertificados() {
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCertificados();
  }, [search]);

  const fetchCertificados = async () => {
    setLoading(true);
    let query = supabase
      .from('certificados')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`generadora_razon_social.ilike.%${search}%,recolectora_razon_social.ilike.%${search}%,numero_certificado.ilike.%${search}%`);
    }

    const { data } = await query;
    setCertificados(data || []);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-headline text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
          Todos los certificados
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Registro completo de certificados de disposición final emitidos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total certificados</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>{certificados.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Generadoras únicas</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
            {new Set(certificados.map(c => c.generadora_razon_social)).size}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total dispuesto</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>
            {certificados.reduce((sum, c) => sum + Number(c.cantidad_dispuesta), 0).toLocaleString()} kg
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por empresa o N° certificado..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-80" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">N° Certificado</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Generadora</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Recolectora</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Residuo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Cantidad</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha recolección</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Destino</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">Cargando...</td></tr>
              ) : certificados.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No hay certificados</td></tr>
              ) : certificados.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium" style={{ color: 'hsl(var(--hero-headline))' }}>{c.numero_certificado}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs">{c.generadora_razon_social}</div>
                    <div className="text-[10px] text-muted-foreground">{c.generadora_nit}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-xs">{c.recolectora_razon_social}</div>
                    <div className="text-[10px] text-muted-foreground">{c.recolectora_nit}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'hsl(145,50%,94%)', color: 'hsl(145,50%,35%)' }}>
                      {c.categoria_residuo}
                    </span>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{c.tipo_residuo}</div>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{Number(c.cantidad_dispuesta).toLocaleString()} {c.unidad}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(c.fecha_recoleccion), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[150px] truncate">{c.destino_final}</td>
                  <td className="px-4 py-3 font-mono text-[10px] text-muted-foreground">{c.codigo_verificacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
