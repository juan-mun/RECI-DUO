import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RecolectoraCertificados() {
  const { user } = useAuth();

  const { data: certificados = [], isLoading } = useQuery({
    queryKey: ['certificados-recolectora', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificados')
        .select('*')
        .eq('recolectora_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
      <div>
        <h1 className="font-headline text-2xl font-bold">Certificados Emitidos</h1>
        <p className="text-muted-foreground mt-1">Certificados de disposición final que has generado.</p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Estos certificados son válidos ante la CAR y demás autoridades ambientales colombianas.
        </p>
      </div>

      {certificados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-headline text-lg font-semibold mb-1">Sin certificados</h3>
            <p className="text-sm text-muted-foreground">Aún no has emitido certificados de disposición final.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {certificados.map((cert) => (
            <Card key={cert.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{cert.numero_certificado}</p>
                  <p className="text-xs text-muted-foreground">
                    {cert.tipo_residuo} · {cert.cantidad_dispuesta} {cert.unidad} · {format(new Date(cert.fecha_recoleccion), "d MMM yyyy", { locale: es })}
                  </p>
                  <p className="text-xs text-muted-foreground">Generadora: {cert.generadora_razon_social}</p>
                </div>
                <Badge variant="outline" className="shrink-0 self-start">{cert.categoria_residuo}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
