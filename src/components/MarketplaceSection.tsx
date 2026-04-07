import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Clock, Search, Users, Calendar as CalendarIcon, Send,
  CheckCircle2, Timer, ArrowRight, Flame, Star, Sparkles,
  FileText, Briefcase, ScrollText, Package,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const CATEGORIAS_RESIDUO = [
  "Peligroso RESPEL", "RCD", "RAEE", "Hospitalario", "Orgánico", "Especial",
];

const FRECUENCIAS = ["Diaria", "Semanal", "Quincenal", "Mensual", "Única vez"];

const categoriaColors: Record<string, string> = {
  "Peligroso RESPEL": "bg-red-500/15 text-red-400 border-red-500/30",
  "RCD": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "RAEE": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Hospitalario": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Orgánico": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Especial": "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const categoriaIconBg: Record<string, string> = {
  "Peligroso RESPEL": "bg-red-500/20",
  "RCD": "bg-orange-500/20",
  "RAEE": "bg-blue-500/20",
  "Hospitalario": "bg-pink-500/20",
  "Orgánico": "bg-emerald-500/20",
  "Especial": "bg-purple-500/20",
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
type TabOption = "disponibles" | "mis_ofertas";

export default function MarketplaceSection() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRecolectora = role === "recolectora";

  // Filters
  const [categoriasFilter, setCategoriasFilter] = useState<string[]>([]);
  const [frecuenciaFilter, setFrecuenciaFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("reciente");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<TabOption>("disponibles");

  // Offer modal
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [ofertaOpen, setOfertaOpen] = useState(false);
  const [precio, setPrecio] = useState("");
  const [fechaOferta, setFechaOferta] = useState<Date | undefined>();
  const [horaLlegada, setHoraLlegada] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [retirandoId, setRetirandoId] = useState<string | null>(null);

  // Data queries
  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ["marketplace-solicitudes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_recoleccion")
        .select("*, solicitud_residuos(*, residuos(nombre, categoria, unidad, cantidad_estimada, descripcion, frecuencia))")
        .in("status", ["publicada", "con_ofertas"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  // My offers (recolectora)
  const { data: misOfertas = [], } = useQuery({
    queryKey: ["mis-ofertas-detail", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ofertas_recoleccion")
        .select("id, solicitud_id, precio_propuesto, fecha_disponible, created_at, status, contrapropuesta_precio, contrapropuesta_fecha, contrapropuesta_mensaje")
        .eq("recolectora_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && isRecolectora,
  });

  const misOfertasMap = useMemo(() => {
    const map: Record<string, any> = {};
    misOfertas.forEach((o: any) => { map[o.solicitud_id] = o; });
    return map;
  }, [misOfertas]);

  const { data: miPerfil } = useQuery({
    queryKey: ["mi-perfil-recolectora", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("razon_social, nit, ciudad, telefono")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && isRecolectora,
  });

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

    if (frecuenciaFilter.length > 0) {
      result = result.filter((sol: any) =>
        sol.solicitud_residuos?.some((sr: any) =>
          frecuenciaFilter.includes(sr.residuos?.frecuencia)
        )
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((sol: any) => {
        const residuoMatch = sol.solicitud_residuos?.some((sr: any) =>
          sr.residuos?.nombre?.toLowerCase().includes(term) ||
          sr.residuos?.categoria?.toLowerCase().includes(term) ||
          sr.residuos?.descripcion?.toLowerCase().includes(term)
        );
        const profileMatch = profileMap[sol.user_id]?.ciudad?.toLowerCase().includes(term) ||
          profileMap[sol.user_id]?.razon_social?.toLowerCase().includes(term);
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
  }, [solicitudes, categoriasFilter, frecuenciaFilter, searchTerm, sortBy, profileMap]);

  // Mutations
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["marketplace-solicitudes"] });
    queryClient.invalidateQueries({ queryKey: ["mis-ofertas-detail"] });
    queryClient.invalidateQueries({ queryKey: ["marketplace-oferta-counts"] });
    queryClient.invalidateQueries({ queryKey: ["solicitudes-disponibles-count"] });
  };

  const enviarOferta = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("ofertas_recoleccion").insert({
        solicitud_id: selectedSolicitud.id,
        recolectora_id: user!.id,
        precio_propuesto: parseFloat(precio),
        fecha_disponible: format(fechaOferta!, "yyyy-MM-dd"),
        mensaje: mensaje || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Oferta enviada", description: "Tu oferta ha sido enviada exitosamente." });
      invalidateAll();
      resetForm();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo enviar la oferta.", variant: "destructive" });
    },
  });

  const retirarOferta = useMutation({
    mutationFn: async (ofertaId: string) => {
      const { error } = await supabase
        .from("ofertas_recoleccion")
        .delete()
        .eq("id", ofertaId)
        .eq("recolectora_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Oferta retirada", description: "Tu oferta ha sido retirada." });
      invalidateAll();
      setRetirandoId(null);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo retirar la oferta.", variant: "destructive" });
      setRetirandoId(null);
    },
  });

  const aceptarContrapropuesta = useMutation({
    mutationFn: async (oferta: any) => {
      const { error } = await supabase
        .from("ofertas_recoleccion")
        .update({
          status: "pendiente",
          precio_propuesto: oferta.contrapropuesta_precio,
          fecha_disponible: oferta.contrapropuesta_fecha,
          contrapropuesta_precio: null,
          contrapropuesta_fecha: null,
          contrapropuesta_mensaje: null,
        })
        .eq("id", oferta.id)
        .eq("recolectora_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Contrapropuesta aceptada", description: "Tu oferta ha sido actualizada." });
      invalidateAll();
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo aceptar la contrapropuesta.", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setOfertaOpen(false);
    setSelectedSolicitud(null);
    setPrecio("");
    setFechaOferta(undefined);
    setHoraLlegada("");
    setMensaje("");
  };

  const handleEnviar = () => {
    if (!precio || !fechaOferta) {
      toast({ title: "Campos requeridos", description: "Ingresa precio y fecha propuesta.", variant: "destructive" });
      return;
    }
    enviarOferta.mutate();
  };

  const toggleCategoria = (cat: string) => {
    setCategoriasFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleFrecuencia = (freq: string) => {
    setFrecuenciaFilter((prev) =>
      prev.includes(freq) ? prev.filter((f) => f !== freq) : [...prev, freq]
    );
  };

  // Activity stats
  const totalPublicaciones = solicitudes.length;
  const gestoresActivos = new Set(solicitudes.map((s: any) => s.user_id)).size;
  const totalOfertas = ofertaCounts.length;

  // Determine if a solicitud is "urgent" (fecha_preferida within 3 days)
  const isUrgent = (sol: any) => {
    const diff = new Date(sol.fecha_preferida).getTime() - Date.now();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
  };

  // My offers tab data
  const solicitudesConMiOferta = useMemo(() => {
    if (!isRecolectora) return [];
    return solicitudes.filter((s: any) => misOfertasMap[s.id]);
  }, [solicitudes, misOfertasMap, isRecolectora]);

  const displayList = activeTab === "disponibles" ? filtered : solicitudesConMiOferta;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex gap-0 h-full min-h-[calc(100vh-4rem)]">
      {/* ===== LEFT SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-border bg-card/50 p-4 gap-5 overflow-y-auto">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar residuos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground"
          />
        </div>

        {/* Tipo de residuo */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tipo de residuo</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS_RESIDUO.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategoria(cat)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-all",
                  categoriasFilter.includes(cat)
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                )}
              >
                {categoriaIcons[cat]} {cat.replace("Peligroso ", "")}
              </button>
            ))}
          </div>
        </div>

        {/* Frecuencia */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Frecuencia</p>
          <div className="flex flex-wrap gap-2">
            {FRECUENCIAS.map((freq) => (
              <button
                key={freq}
                onClick={() => toggleFrecuencia(freq)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition-all",
                  frecuenciaFilter.includes(freq)
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-muted/30 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground"
                )}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-border" />

        {/* Activity stats */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Actividad hoy</p>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-3.5 w-3.5" /> Publicaciones nuevas
              </span>
              <span className="font-semibold text-foreground">{totalPublicaciones}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-3.5 w-3.5" /> Gestores activos
              </span>
              <span className="font-semibold text-foreground">{gestoresActivos}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Send className="h-3.5 w-3.5" /> Ofertas enviadas
              </span>
              <span className="font-semibold text-foreground">{totalOfertas}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 overflow-y-auto">
        {/* Tabs bar */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-5 py-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("disponibles")}
            className={cn(
              "text-sm px-4 py-2 rounded-full font-medium transition-all",
              activeTab === "disponibles"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            Residuos disponibles
            <span className={cn(
              "ml-2 text-xs px-1.5 py-0.5 rounded-full",
              activeTab === "disponibles" ? "bg-primary-foreground/20" : "bg-muted"
            )}>
              {filtered.length}
            </span>
          </button>

          {isRecolectora && (
            <button
              onClick={() => setActiveTab("mis_ofertas")}
              className={cn(
                "text-sm px-4 py-2 rounded-full font-medium transition-all",
                activeTab === "mis_ofertas"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              Mis ofertas
              {misOfertas.length > 0 && (
                <span className={cn(
                  "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                  activeTab === "mis_ofertas" ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {misOfertas.length}
                </span>
              )}
            </button>
          )}

          {/* Right: sort */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline">↕</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-transparent border-border">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reciente">Más recientes</SelectItem>
                <SelectItem value="cantidad">Mayor cantidad</SelectItem>
                <SelectItem value="urgente">Más urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Mobile search */}
          <div className="lg:hidden mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar residuos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg bg-muted/50 border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-semibold text-foreground">{displayList.length}</span> residuos disponibles
          </p>

          {/* Cards grid */}
          {displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="font-headline text-lg font-semibold mb-2">
                {activeTab === "mis_ofertas" ? "No has enviado ofertas aún" : "No hay solicitudes disponibles"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {activeTab === "mis_ofertas"
                  ? "Explora las solicitudes disponibles y envía tu primera oferta."
                  : categoriasFilter.length > 0 || searchTerm
                    ? "Intenta ajustar los filtros de búsqueda."
                    : "Aún no se han publicado solicitudes de recolección."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayList.map((sol: any) => {
                const profile = profileMap[sol.user_id];
                const ofertas = ofertaCountMap[sol.id] || 0;
                const residuos = sol.solicitud_residuos || [];
                const yaOfertada = isRecolectora ? misOfertasMap[sol.id] : null;
                const urgent = isUrgent(sol);
                const primaryResiduo = residuos[0]?.residuos;
                const primaryCategoria = primaryResiduo?.categoria || "Especial";
                const tiempoPublicada = formatDistanceToNow(new Date(sol.created_at), { locale: es, addSuffix: false });

                return (
                  <Card key={sol.id} className={cn(
                    "group hover:border-primary/30 transition-all duration-200 overflow-hidden",
                    yaOfertada && "border-primary/30 ring-1 ring-primary/10"
                  )}>
                    <CardContent className="p-5 space-y-3.5">
                      {/* Top row: icon + category + title + badges */}
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0",
                          categoriaIconBg[primaryCategoria] || "bg-muted"
                        )}>
                          {categoriaIcons[primaryCategoria] || "📦"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              primaryCategoria === "Peligroso RESPEL" ? "text-red-400"
                                : primaryCategoria === "RCD" ? "text-orange-400"
                                : primaryCategoria === "RAEE" ? "text-blue-400"
                                : primaryCategoria === "Hospitalario" ? "text-pink-400"
                                : primaryCategoria === "Orgánico" ? "text-emerald-400"
                                : "text-purple-400"
                            )}>
                              {primaryCategoria}
                            </span>
                            {urgent && (
                              <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px] px-1.5 py-0">
                                <Flame className="h-2.5 w-2.5 mr-0.5" /> Urgente
                              </Badge>
                            )}
                            {sol.status === "con_ofertas" && (
                              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] px-1.5 py-0">
                                <Star className="h-2.5 w-2.5 mr-0.5" /> Destacado
                              </Badge>
                            )}
                            {!urgent && sol.status === "publicada" && (
                              <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Nuevo
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-sm text-foreground mt-0.5 truncate">
                            {primaryResiduo?.nombre || "Residuo"}
                          </h3>
                        </div>
                      </div>

                      {/* Description */}
                      {primaryResiduo?.descripcion && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {primaryResiduo.descripcion}
                        </p>
                      )}

                      {/* Tags / residuos chips */}
                      <div className="flex flex-wrap gap-1.5">
                        {residuos.map((sr: any) => (
                          <span
                            key={sr.id}
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded border font-medium",
                              categoriaColors[sr.residuos?.categoria] || "bg-muted/50 text-muted-foreground border-border"
                            )}
                          >
                            {sr.residuos?.nombre}
                          </span>
                        ))}
                      </div>

                      {/* Location + frequency */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {profile?.ciudad || "Bogotá"}
                        </span>
                        {primaryResiduo?.frecuencia && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {primaryResiduo.frecuencia}
                          </span>
                        )}
                      </div>

                      {/* Bottom row: quantity + avatars + action */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <div className="flex items-center gap-3">
                          {/* Quantity */}
                          <div>
                            <span className="text-xl font-bold text-foreground">
                              {residuos.reduce((sum: number, sr: any) => sum + (sr.cantidad_real || 0), 0).toLocaleString("es-CO")}
                            </span>
                            <span className="text-xs text-muted-foreground ml-1">
                              {primaryResiduo?.unidad || "kg"}
                            </span>
                          </div>

                          {/* Gestores (avatars) */}
                          {ofertas > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex -space-x-1.5">
                                {Array.from({ length: Math.min(ofertas, 4) }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-6 h-6 rounded-full border-2 border-card flex items-center justify-center text-[8px] font-bold text-primary-foreground",
                                      i === 0 ? "bg-emerald-600" : i === 1 ? "bg-blue-600" : i === 2 ? "bg-amber-600" : "bg-purple-600"
                                    )}
                                  >
                                    {["GR", "EC", "AM", "RS"][i]}
                                  </div>
                                ))}
                                {ofertas > 4 && (
                                  <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[8px] font-medium text-muted-foreground">
                                    +{ofertas - 4}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">{ofertas} gestores</span>
                            </div>
                          )}
                        </div>

                        {/* Action button */}
                        {isRecolectora ? (
                          yaOfertada ? (
                            <OfertaStatusBadge
                              oferta={yaOfertada}
                              retirarOferta={retirarOferta}
                              aceptarContrapropuesta={aceptarContrapropuesta}
                              retirandoId={retirandoId}
                              setRetirandoId={setRetirandoId}
                            />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
                              onClick={() => { setSelectedSolicitud(sol); setOfertaOpen(true); }}
                            >
                              Aplicar <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          )
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            {ofertas > 0 ? `${ofertas} oferta${ofertas !== 1 ? "s" : ""}` : "Sin ofertas"}
                          </span>
                        )}
                      </div>

                      {/* Time ago */}
                      <p className="text-[10px] text-muted-foreground/60">
                        Hace {tiempoPublicada}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Offer dialog */}
      {isRecolectora && (
        <Dialog open={ofertaOpen} onOpenChange={(v) => { if (!v) resetForm(); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Enviar Oferta de Recolección</DialogTitle>
            </DialogHeader>

            {selectedSolicitud && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1.5">
                  <p className="font-medium">{profileMap[selectedSolicitud.user_id]?.razon_social || "Empresa generadora"}</p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {profileMap[selectedSolicitud.user_id]?.ciudad || "Bogotá"}
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(new Date(selectedSolicitud.fecha_preferida), "d 'de' MMMM, yyyy", { locale: es })}
                    {" · "}
                    {selectedSolicitud.rango_horario_inicio?.slice(0, 5)} – {selectedSolicitud.rango_horario_fin?.slice(0, 5)}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedSolicitud.solicitud_residuos?.map((sr: any) => (
                      <span key={sr.id} className={cn("text-xs px-2 py-0.5 rounded-full border", categoriaColors[sr.residuos?.categoria] || "bg-muted")}>
                        {sr.residuos?.nombre} — {sr.cantidad_real} {sr.residuos?.unidad}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Precio propuesto (COP) *</Label>
                  <Input type="number" placeholder="Ej: 350000" value={precio} onChange={(e) => setPrecio(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Fecha propuesta para recolección *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left", !fechaOferta && "text-muted-foreground")}>
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {fechaOferta ? format(fechaOferta, "d 'de' MMMM, yyyy", { locale: es }) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={fechaOferta} onSelect={setFechaOferta} disabled={(date) => date < new Date()} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Hora estimada de llegada</Label>
                  <Input type="time" value={horaLlegada} onChange={(e) => setHoraLlegada(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label>Mensaje (opcional, máx. 200 caracteres)</Label>
                  <Textarea placeholder="Describe tu propuesta..." value={mensaje} onChange={(e) => setMensaje(e.target.value.slice(0, 200))} rows={2} maxLength={200} />
                  <p className="text-xs text-muted-foreground text-right">{mensaje.length}/200</p>
                </div>

                {miPerfil && (
                  <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Así te verá el generador</p>
                    <p className="font-medium text-sm">{miPerfil.razon_social}</p>
                    <p className="text-muted-foreground">NIT: {miPerfil.nit} · {miPerfil.ciudad}</p>
                    <p className="text-muted-foreground">Tel: {miPerfil.telefono}</p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleEnviar} disabled={enviarOferta.isPending}>
                {enviarOferta.isPending ? "Enviando..." : "Confirmar oferta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/** Compact offer status for card bottom */
function OfertaStatusBadge({ oferta, retirarOferta, aceptarContrapropuesta, retirandoId, setRetirandoId }: any) {
  if (oferta.status === "pendiente") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
          <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Enviada
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] text-destructive h-6 px-2"
          disabled={retirarOferta.isPending && retirandoId === oferta.id}
          onClick={() => { setRetirandoId(oferta.id); retirarOferta.mutate(oferta.id); }}
        >
          Retirar
        </Button>
      </div>
    );
  }

  if (oferta.status === "negociando") {
    return (
      <div className="flex items-center gap-1.5">
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">
          💬 Contrapropuesta
        </Badge>
        <Button
          size="sm"
          className="text-[10px] h-6 px-2"
          onClick={() => aceptarContrapropuesta.mutate(oferta)}
          disabled={aceptarContrapropuesta.isPending}
        >
          Aceptar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-[10px] text-destructive h-6 px-2"
          onClick={() => { setRetirandoId(oferta.id); retirarOferta.mutate(oferta.id); }}
          disabled={retirarOferta.isPending && retirandoId === oferta.id}
        >
          ✕
        </Button>
      </div>
    );
  }

  if (oferta.status === "aceptada") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
        ✅ Aceptada
      </Badge>
    );
  }

  return <Badge variant="secondary" className="text-[10px]">Rechazada</Badge>;
}
