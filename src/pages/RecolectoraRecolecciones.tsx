import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function RecolectoraRecolecciones() {
  const { user } = useAuth();

  const { data: ofertas = [], isLoading } = useQuery({
    queryKey: ['mis-recolecciones', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofertas_recoleccion')
        .select('*, solicitudes_recoleccion:solicitud_id(*, solicitud_residuos(*, residuos(nombre, categoria, unidad)))')
        .eq('recolectora_id', user!.id)
        .eq('status', 'aceptada')
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
        <h1 className="font-headline text-2xl font-bold">Mis Recolecciones</h1>
        <p className="text-muted-foreground mt-1">Recolecciones con ofertas aceptadas por empresas generadoras.</p>
      </div>

      {ofertas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-headline text-lg font-semibold mb-1">Sin recolecciones activas</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Aún no tienes ofertas aceptadas. Envía ofertas en las solicitudes disponibles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {ofertas.map((oferta: any) => {
            const sol = oferta.solicitudes_recoleccion;
            return (
              <Card key={oferta.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-100 text-green-800">Aceptada</Badge>
                    <span className="text-sm font-semibold text-primary">
                      ${Number(oferta.precio_propuesto).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span>{sol?.direccion_recoleccion}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Recolección: {oferta.fecha_disponible ? format(new Date(oferta.fecha_disponible), "d MMM yyyy", { locale: es }) : '—'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {sol?.solicitud_residuos?.map((sr: any) => (
                      <span key={sr.id} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {sr.residuos?.nombre}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
