import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  MapPin, Clock, Package, Search, SlidersHorizontal,
  FileText, Users, Calendar as CalendarIcon,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CATEGORIAS_RESIDUO = [
  "Peligroso RESPEL", "RCD", "RAEE", "Hospitalario", "Orgánico", "Especial",
];

const categoriaColors: Record<string, string> = {
  "Peligroso RESPEL": "bg-red-500/15 text-red-400 border-red-500/30",
  "RCD": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "RAEE": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Hospitalario": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Orgánico": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Especial": "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const categoriaIcons: Record<string, string> = {
  "Peligroso RESPEL": "☢️",
  "RCD": "🧱",
  "RAEE": "💻",
  "Hospitalario": "🏥",
  "Orgánico": "🌿",
  "Especial": "⚠️",
};

type SortOption = "reciente" | "cantidad" | "urgente";

export default function MarketplaceSection() {
  const [categoriasFilter, setCategoriasFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("reciente");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch published solicitudes with their residuos
  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ["marketplace-solicitudes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_recoleccion")
        .select("*, solicitud_residuos(*, residuos(nombre, categoria, unidad, cantidad_estimada, descripcion))")
        .in("status", ["publicada", "con_ofertas"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch profiles for solicitud owners
  const userIds = useMemo(() => [...new Set(solicitudes.map((s: any) => s.user_id))], [solicitudes]);
  const { data: profiles = [] } = useQuery({
    queryKey: ["marketplace-profiles", userIds],
    queryFn: async () => {
      if (userIds.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, razon_social, ciudad")
        .in("user_id", userIds);
      if (error) throw error;
      return data;
    },
    enabled: userIds.length > 0,
  });

  const profileMap = useMemo(() => {
    const map: Record<string, { razon_social: string; ciudad: string }> = {};
    profiles.forEach((p: any) => { map[p.user_id] = p; });
    return map;
  }, [profiles]);

  // Fetch offer counts
  const solicitudIds = useMemo(() => solicitudes.map((s: any) => s.id), [solicitudes]);
  const { data: ofertaCounts = [] } = useQuery({
    queryKey: ["marketplace-oferta-counts", solicitudIds],
    queryFn: async () => {
      if (solicitudIds.length === 0) return [];
      const { data, error } = await supabase
        .from("ofertas_recoleccion")
        .select("solicitud_id")
        .in("solicitud_id", solicitudIds);
      if (error) throw error;
      return data;
    },
    enabled: solicitudIds.length > 0,
  });

  const ofertaCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    ofertaCounts.forEach((o: any) => {
      map[o.solicitud_id] = (map[o.solicitud_id] || 0) + 1;
    });
    return map;
  }, [ofertaCounts]);

  // Filter & sort
  const filtered = useMemo(() => {
    let result = [...solicitudes];

    if (categoriasFilter.length > 0) {
      result = result.filter((sol: any) =>
        sol.solicitud_residuos?.some((sr: any) =>
          categoriasFilter.includes(sr.residuos?.categoria)
        )
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((sol: any) => {
        const residuoMatch = sol.solicitud_residuos?.some((sr: any) =>
          sr.residuos?.nombre?.toLowerCase().includes(term) ||
          sr.residuos?.categoria?.toLowerCase().includes(term)
        );
        const profileMatch = profileMap[sol.user_id]?.ciudad?.toLowerCase().includes(term);
        return residuoMatch || profileMatch;
      });
    }

    if (sortBy === "reciente") {
      result.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === "cantidad") {
      result.sort((a: any, b: any) => {
        const maxA = Math.max(...(a.solicitud_residuos?.map((sr: any) => sr.cantidad_real) || [0]));
        const maxB = Math.max(...(b.solicitud_residuos?.map((sr: any) => sr.cantidad_real) || [0]));
        return maxB - maxA;
      });
    } else if (sortBy === "urgente") {
      result.sort((a: any, b: any) => new Date(a.fecha_preferida).getTime() - new Date(b.fecha_preferida).getTime());
    }

    return result;
  }, [solicitudes, categoriasFilter, searchTerm, sortBy, profileMap]);

  const toggleCategoria = (cat: string) => {
    setCategoriasFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-headline text-2xl font-bold">Solicitudes Disponibles</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Solicitudes de recolección publicadas en la plataforma.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[170px] h-9 text-sm">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reciente">Más reciente</SelectItem>
              <SelectItem value="cantidad">Mayor cantidad</SelectItem>
              <SelectItem value="urgente">Más urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por residuo, categoría o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_RESIDUO.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategoria(cat)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                categoriasFilter.includes(cat)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {categoriaIcons[cat]} {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> solicitud{filtered.length !== 1 ? "es" : ""} disponible{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="font-semibold text-lg">No hay solicitudes disponibles</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {categoriasFilter.length > 0 || searchTerm
                ? "Intenta ajustar los filtros de búsqueda."
                : "Aún no se han publicado solicitudes de recolección."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((sol: any) => {
            const profile = profileMap[sol.user_id];
            const ofertas = ofertaCountMap[sol.id] || 0;
            const residuos = sol.solicitud_residuos || [];

            return (
              <Card key={sol.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-3">
                  {/* Status + time */}
                  <div className="flex items-center justify-between">
                    <Badge variant={sol.status === "con_ofertas" ? "default" : "secondary"} className="text-xs">
                      {sol.status === "publicada" ? "Publicada" : "Con ofertas"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(sol.created_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>

                  {/* Residuos list */}
                  <div className="space-y-2">
                    {residuos.map((sr: any) => (
                      <div key={sr.id} className="flex items-start gap-2">
                        <Badge variant="outline" className={cn("text-[10px] shrink-0 border", categoriaColors[sr.residuos?.categoria] || "")}>
                          {categoriaIcons[sr.residuos?.categoria] || "📦"} {sr.residuos?.categoria}
                        </Badge>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{sr.residuos?.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            {sr.cantidad_real} {sr.residuos?.unidad}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-1">
                    {profile?.ciudad && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {profile.ciudad}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {format(new Date(sol.fecha_preferida), "d MMM yyyy", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {sol.rango_horario_inicio?.slice(0, 5)} - {sol.rango_horario_fin?.slice(0, 5)}
                    </span>
                  </div>

                  {/* Offers count */}
                  {ofertas > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {ofertas} oferta{ofertas !== 1 ? "s" : ""} recibida{ofertas !== 1 ? "s" : ""}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
