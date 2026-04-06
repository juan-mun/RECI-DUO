import { useEffect, useState } from 'react';
import { Download, TrendingUp, Leaf, Activity, Star, AlertTriangle, Award, BarChart3, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

interface ReportData {
  generadorasCount: number;
  recolectorasCount: number;
  solicitudesTotales: number;
  solicitudesCompletadas: number;
  certificadosTotal: number;
  residuosDistribucion: { name: string; value: number; color: string }[];
  topGeneradoras: { empresa: string; solicitudes: number }[];
  topRecolectoras: { empresa: string; certificados: number }[];
}

const pieColors = [
  'hsl(0, 70%, 55%)', 'hsl(35, 80%, 55%)', 'hsl(205, 75%, 48%)',
  'hsl(280, 60%, 55%)', 'hsl(152, 55%, 40%)', 'hsl(210, 10%, 60%)',
];

export default function AdminReportes() {
  const [periodo, setPeriodo] = useState('6meses');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Counts by role
        const { data: roles } = await supabase.from('user_roles').select('role');
        const generadorasCount = roles?.filter(r => r.role === 'generadora').length || 0;
        const recolectorasCount = roles?.filter(r => r.role === 'recolectora').length || 0;

        // Solicitudes
        const { data: solicitudes } = await supabase.from('solicitudes_recoleccion').select('id, status, user_id');
        const solicitudesTotales = solicitudes?.length || 0;
        const solicitudesCompletadas = solicitudes?.filter(s => s.status === 'completada').length || 0;

        // Certificados
        const { count: certCount } = await supabase.from('certificados').select('*', { count: 'exact', head: true });

        // Residuos by category
        const { data: residuos } = await supabase.from('residuos').select('categoria, cantidad_estimada');
        const catMap: Record<string, number> = {};
        residuos?.forEach(r => { catMap[r.categoria] = (catMap[r.categoria] || 0) + Number(r.cantidad_estimada); });
        const residuosDistribucion = Object.entries(catMap).map(([name, value], i) => ({
          name, value, color: pieColors[i % pieColors.length],
        }));

        // Top generadoras by solicitudes
        const genSolCount: Record<string, number> = {};
        solicitudes?.forEach(s => { genSolCount[s.user_id] = (genSolCount[s.user_id] || 0) + 1; });
        const { data: profiles } = await supabase.from('profiles').select('user_id, razon_social');
        const profileMap: Record<string, string> = {};
        profiles?.forEach(p => { profileMap[p.user_id] = p.razon_social; });

        const topGeneradoras = Object.entries(genSolCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([uid, count]) => ({ empresa: profileMap[uid] || uid, solicitudes: count }));

        // Top recolectoras by certificados
        const { data: certs } = await supabase.from('certificados').select('recolectora_id, recolectora_razon_social');
        const recCertCount: Record<string, { name: string; count: number }> = {};
        certs?.forEach(c => {
          if (!recCertCount[c.recolectora_id]) recCertCount[c.recolectora_id] = { name: c.recolectora_razon_social, count: 0 };
          recCertCount[c.recolectora_id].count++;
        });
        const topRecolectoras = Object.values(recCertCount)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .map(r => ({ empresa: r.name, certificados: r.count }));

        setData({
          generadorasCount, recolectorasCount,
          solicitudesTotales, solicitudesCompletadas,
          certificadosTotal: certCount || 0,
          residuosDistribucion,
          topGeneradoras, topRecolectoras,
        });
      } catch (err) {
        console.error('Error fetching report data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!data) return null;

  const tasaExito = data.solicitudesTotales > 0
    ? Math.round((data.solicitudesCompletadas / data.solicitudesTotales) * 100)
    : 0;

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-headline text-2xl font-bold text-foreground">Reportes y métricas</h1>
          <p className="text-muted-foreground text-sm mt-1">Inteligencia de negocio de la plataforma</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mes">Este mes</SelectItem>
              <SelectItem value="3meses">Últimos 3 meses</SelectItem>
              <SelectItem value="6meses">Últimos 6 meses</SelectItem>
              <SelectItem value="año">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => toast.success('Generando reporte PDF...')}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success('Exportando a Excel...')}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
        </div>
      </div>

      {/* Resumen */}
      <div>
        <h2 className="font-headline text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" /> Resumen de la plataforma
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-3xl font-headline font-bold text-foreground">{data.generadorasCount + data.recolectorasCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Empresas registradas</p>
              <p className="text-xs text-muted-foreground">{data.generadorasCount} gen · {data.recolectorasCount} rec</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-3xl font-headline font-bold text-foreground">{data.solicitudesTotales}</p>
              <p className="text-xs text-muted-foreground mt-1">Solicitudes totales</p>
              <p className="text-xs text-muted-foreground">{data.solicitudesCompletadas} completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-3xl font-headline font-bold text-foreground">{data.certificadosTotal}</p>
              <p className="text-xs text-muted-foreground mt-1">Certificados emitidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-5 text-center">
              <p className="text-3xl font-headline font-bold text-foreground">{tasaExito}%</p>
              <p className="text-xs text-muted-foreground mt-1">Tasa de éxito</p>
              <p className="text-xs text-muted-foreground">completadas / totales</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Operaciones */}
      <div>
        <h2 className="font-headline text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-accent" /> Operaciones
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.residuosDistribucion.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Distribución por categoría de residuo</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={data.residuosDistribucion} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                      {data.residuosDistribucion.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <p className="text-sm">No hay residuos registrados aún para mostrar distribución.</p>
              </CardContent>
            </Card>
          )}

          <Card className="flex flex-col justify-center">
            <CardContent className="pt-6 text-center space-y-6">
              <div>
                <Clock className="h-8 w-8 mx-auto text-accent mb-2" />
                <p className="text-2xl font-headline font-bold text-foreground">{data.solicitudesTotales}</p>
                <p className="text-sm text-muted-foreground">Solicitudes registradas en la plataforma</p>
              </div>
              <Separator />
              <div>
                <Award className="h-8 w-8 mx-auto text-primary mb-2" />
                <p className="text-2xl font-headline font-bold text-foreground">{data.certificadosTotal}</p>
                <p className="text-sm text-muted-foreground">Certificados de disposición final emitidos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Impacto ambiental */}
      <div>
        <h2 className="font-headline text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <Leaf className="h-5 w-5 text-primary" /> Impacto ambiental
        </h2>
        <Card className="border-primary/20" style={{ background: 'linear-gradient(135deg, hsl(150,30%,96%), hsl(152,55%,95%))' }}>
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <Leaf className="h-12 w-12 mx-auto text-primary" />
            <p className="text-5xl font-headline font-bold" style={{ color: 'hsl(152,55%,35%)' }}>{data.certificadosTotal}</p>
            <p className="text-lg font-medium text-foreground">certificados de disposición final emitidos</p>
            <p className="text-sm text-muted-foreground">garantizando la trazabilidad ambiental en la plataforma</p>
          </CardContent>
        </Card>
      </div>

      {/* Salud de la plataforma */}
      <div>
        <h2 className="font-headline text-lg font-bold text-foreground flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-foreground" /> Empresas más activas
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top generadoras por solicitudes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.topGeneradoras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin datos suficientes</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Solicitudes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topGeneradoras.map((g, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{g.empresa}</TableCell>
                        <TableCell className="text-right">{g.solicitudes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top recolectoras por certificados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.topRecolectoras.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sin datos suficientes</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Certificados</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topRecolectoras.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium text-sm">{r.empresa}</TableCell>
                        <TableCell className="text-right">{r.certificados}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
