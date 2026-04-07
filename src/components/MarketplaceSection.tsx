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
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin, Clock, Package, Search, SlidersHorizontal,
  Users, Calendar as CalendarIcon, Send, CheckCircle2, Timer,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const LOCALIDADES_BOGOTA = [
  "Usaquén", "Chapinero", "Santa Fe", "San Cristóbal", "Usme",
  "Tunjuelito", "Bosa", "Kennedy", "Fontibón", "Engativá",
  "Suba", "Barrios Unidos", "Teusaquillo", "Los Mártires",
  "Antonio Nariño", "Puente Aranda", "La Candelaria",
  "Rafael Uribe Uribe", "Ciudad Bolívar", "Sumapaz",
];

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
  const { user, role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isRecolectora = role === "recolectora";

  // Filters
  const [categoriasFilter, setCategoriasFilter] = useState<string[]>([]);
  const [localidadFilter, setLocalidadFilter] = useState<string>("todas");
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [cantidadRange, setCantidadRange] = useState<number[]>([0]);
  const [sortBy, setSortBy] = useState<SortOption>("reciente");
  const [showFilters, setShowFilters] = useState(false);

  // Offer modal (recolectora only)
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
        .select("*, solicitud_residuos(*, residuos(nombre, categoria, unidad, cantidad_estimada, descripcion))")
        .in("status", ["publicada", "con_ofertas"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Profiles
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

  // Offer counts
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

  // My offers (recolectora only)
  const { data: misOfertasMap = {} } = useQuery({
    queryKey: ["mis-ofertas-detail", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ofertas_recoleccion")
        .select("id, solicitud_id, precio_propuesto, fecha_disponible, created_at, status, contrapropuesta_precio, contrapropuesta_fecha, contrapropuesta_mensaje")
        .eq("recolectora_id", user!.id);
      if (error) throw error;
      const map: Record<string, any> = {};
      data.forEach((o: any) => { map[o.solicitud_id] = o; });
      return map;
    },
    enabled: !!user && isRecolectora,
  });

  // My profile (recolectora only)
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

    if (localidadFilter && localidadFilter !== "todas") {
      result = result.filter((sol: any) => {
        const ciudad = profileMap[sol.user_id]?.ciudad || "";
        return ciudad.toLowerCase().includes(localidadFilter.toLowerCase());
      });
    }

    if (fechaDesde) {
      result = result.filter((sol: any) => new Date(sol.fecha_preferida) >= fechaDesde);
    }
    if (fechaHasta) {
      result = result.filter((sol: any) => new Date(sol.fecha_preferida) <= fechaHasta);
    }

    if (cantidadRange[0] > 0) {
      result = result.filter((sol: any) =>
        sol.solicitud_residuos?.some((sr: any) => sr.cantidad_real >= cantidadRange[0])
      );
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
  }, [solicitudes, categoriasFilter, localidadFilter, fechaDesde, fechaHasta, cantidadRange, sortBy, profileMap]);

  // Mutations (recolectora only)
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
      toast({ title: "Oferta retirada", description: "Tu oferta ha sido retirada exitosamente." });
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

  const clearFilters = () => {
    setCategoriasFilter([]);
    setLocalidadFilter("todas");
    setFechaDesde(undefined);
    setFechaHasta(undefined);
    setCantidadRange([0]);
    setSortBy("reciente");
  };

  const hasActiveFilters = categoriasFilter.length > 0 || localidadFilter !== "todas" || fechaDesde || fechaHasta || cantidadRange[0] > 0;

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
          <h1 className="font-headline text-2xl font-bold">Marketplace</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isRecolectora
              ? "Encuentra solicitudes de recolección y envía tus ofertas."
              : "Solicitudes de recolección publicadas en la plataforma."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-1" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 text-xs">
                {categoriasFilter.length + (localidadFilter !== "todas" ? 1 : 0) + (fechaDesde ? 1 : 0) + (fechaHasta ? 1 : 0) + (cantidadRange[0] > 0 ? 1 : 0)}
              </Badge>
            )}
          </Button>
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

      {/* Filters panel */}
      {showFilters && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Categorías */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo de residuo</Label>
              <div className="flex flex-wrap gap-2 mt-2">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Localidad */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Localidad</Label>
                <Select value={localidadFilter} onValueChange={setLocalidadFilter}>
                  <SelectTrigger className="mt-1.5 h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las localidades</SelectItem>
                    {LOCALIDADES_BOGOTA.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha desde */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha desde</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1.5 h-9 justify-start text-sm", !fechaDesde && "text-muted-foreground")}>
                      <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                      {fechaDesde ? format(fechaDesde, "d MMM yyyy", { locale: es }) : "Desde"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fecha hasta */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha hasta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full mt-1.5 h-9 justify-start text-sm", !fechaHasta && "text-muted-foreground")}>
                      <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                      {fechaHasta ? format(fechaHasta, "d MMM yyyy", { locale: es }) : "Hasta"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Cantidad slider */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Cantidad mínima estimada: {cantidadRange[0] > 0 ? `${cantidadRange[0]} kg+` : "Sin mínimo"}
              </Label>
              <Slider
                value={cantidadRange}
                onValueChange={setCantidadRange}
                max={5000}
                step={50}
                className="mt-2"
              />
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{filtered.length}</span> solicitud{filtered.length !== 1 ? "es" : ""} disponible{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-headline text-lg font-semibold mb-2">No hay solicitudes disponibles</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {hasActiveFilters
                ? "Intenta ajustar los filtros de búsqueda."
                : "Aún no se han publicado solicitudes de recolección."}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((sol: any) => {
            const profile = profileMap[sol.user_id];
            const ofertas = ofertaCountMap[sol.id] || 0;
            const residuos = sol.solicitud_residuos || [];
            const yaOfertada = isRecolectora ? misOfertasMap[sol.id] : null;
            const tiempoPublicada = formatDistanceToNow(new Date(sol.created_at), { locale: es, addSuffix: true });

            return (
              <Card key={sol.id} className={cn(
                "hover:shadow-md transition-shadow",
                yaOfertada && "border-primary/30 bg-primary/[0.02]"
              )}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    {/* Left: content */}
                    <div className="flex-1 space-y-3">
                      {/* Header: empresa + time */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">
                              {profile?.razon_social || "Empresa generadora"}
                            </p>
                            <Badge variant={sol.status === "con_ofertas" ? "default" : "secondary"} className="text-[10px]">
                              {sol.status === "publicada" ? "Publicada" : "Con ofertas"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span>{profile?.ciudad || "Bogotá"}</span>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                          <Timer className="h-3 w-3" />
                          {tiempoPublicada}
                        </span>
                      </div>

                      {/* Residuos with marketplace visual style */}
                      <div className="flex flex-wrap gap-2">
                        {residuos.map((sr: any) => (
                          <div
                            key={sr.id}
                            className={cn(
                              "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border",
                              categoriaColors[sr.residuos?.categoria] || "bg-muted/50 text-muted-foreground border-border"
                            )}
                          >
                            <span>{categoriaIcons[sr.residuos?.categoria] || "📦"}</span>
                            <span>{sr.residuos?.nombre}</span>
                            <span className="opacity-70">· {sr.cantidad_real} {sr.residuos?.unidad}</span>
                          </div>
                        ))}
                      </div>

                      {/* Meta info */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {format(new Date(sol.fecha_preferida), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {sol.rango_horario_inicio?.slice(0, 5)} – {sol.rango_horario_fin?.slice(0, 5)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {ofertas} oferta{ofertas !== 1 ? "s" : ""} recibida{ofertas !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {sol.instrucciones_especiales && (
                        <p className="text-xs text-muted-foreground italic line-clamp-1">
                          "{sol.instrucciones_especiales}"
                        </p>
                      )}
                    </div>

                    {/* Right: action (recolectora only) */}
                    {isRecolectora && (
                      <div className="shrink-0 flex flex-col items-end gap-2 min-w-[180px]">
                        {yaOfertada ? (
                          <OfertaStatus
                            oferta={yaOfertada}
                            retirarOferta={retirarOferta}
                            aceptarContrapropuesta={aceptarContrapropuesta}
                            retirandoId={retirandoId}
                            setRetirandoId={setRetirandoId}
                          />
                        ) : (
                          <Button
                            onClick={() => { setSelectedSolicitud(sol); setOfertaOpen(true); }}
                            className="w-full lg:w-auto"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Enviar oferta
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Offer dialog (recolectora only) */}
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
                  <Textarea placeholder="Describe tu propuesta o condiciones especiales..." value={mensaje} onChange={(e) => setMensaje(e.target.value.slice(0, 200))} rows={2} maxLength={200} />
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

/** Sub-component for offer status display */
function OfertaStatus({ oferta, retirarOferta, aceptarContrapropuesta, retirandoId, setRetirandoId }: any) {
  if (oferta.status === "pendiente") {
    return (
      <div className="text-right space-y-1.5">
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Oferta enviada ✓
        </Badge>
        <p className="text-xs text-muted-foreground">
          ${Number(oferta.precio_propuesto).toLocaleString("es-CO")} COP
        </p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(oferta.fecha_disponible), "d MMM yyyy", { locale: es })}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 mt-1"
          disabled={retirarOferta.isPending && retirandoId === oferta.id}
          onClick={() => {
            setRetirandoId(oferta.id);
            retirarOferta.mutate(oferta.id);
          }}
        >
          {retirarOferta.isPending && retirandoId === oferta.id ? "Retirando..." : "Retirar oferta"}
        </Button>
      </div>
    );
  }

  if (oferta.status === "negociando") {
    return (
      <div className="space-y-2 text-left">
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
          💬 Contrapropuesta recibida
        </Badge>
        <div className="text-xs bg-muted/50 rounded p-2 space-y-1">
          {oferta.contrapropuesta_precio && (
            <p>Nuevo precio: <span className="font-semibold">${Number(oferta.contrapropuesta_precio).toLocaleString("es-CO")} COP</span></p>
          )}
          {oferta.contrapropuesta_fecha && (
            <p>Nueva fecha: {format(new Date(oferta.contrapropuesta_fecha + "T00:00:00"), "d MMM yyyy", { locale: es })}</p>
          )}
          {oferta.contrapropuesta_mensaje && (
            <p className="italic text-muted-foreground">"{oferta.contrapropuesta_mensaje}"</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => aceptarContrapropuesta.mutate(oferta)} disabled={aceptarContrapropuesta.isPending}>
            Aceptar
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => {
              setRetirandoId(oferta.id);
              retirarOferta.mutate(oferta.id);
            }}
            disabled={retirarOferta.isPending && retirandoId === oferta.id}
          >
            Retirar
          </Button>
        </div>
      </div>
    );
  }

  if (oferta.status === "aceptada") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
        ✅ Oferta aceptada
      </Badge>
    );
  }

  if (oferta.status === "rechazada") {
    return <Badge variant="secondary">Oferta rechazada</Badge>;
  }

  return null;
}
