import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Flame,
  Sparkles,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Search,
  ArrowUpDown,
  Zap,
  Beaker,
  Cpu,
  Building2,
  Leaf,
  Package,
  TrendingUp,
  Users,
  FileText,
} from "lucide-react";

const MOCK_LISTINGS = [
  {
    id: 1,
    tipo: "RESPEL",
    icono: Flame,
    nombre: "Aceites usados industriales",
    badges: ["Urgente", "Destacado"],
    descripcion: "Aceites lubricantes y de corte usados de proceso de manufactura CNC. Requiere transporte especializado con tanque certificado.",
    tags: ["Decreto 4741", "RESPEL Y21", "Clase 3"],
    ubicacion: "Bogotá, Fontibón",
    frecuencia: "Quincenal",
    volumen: "2,500",
    unidad: "L",
    aplicantes: 4,
    tiempo: "Hace 2h",
  },
  {
    id: 2,
    tipo: "RAEE",
    icono: Cpu,
    nombre: "Equipos de cómputo obsoletos",
    badges: ["Nuevo"],
    descripcion: "Lote de 120 computadores portátiles y de escritorio para disposición certificada con destrucción de datos.",
    tags: ["Ley 1672/2013", "RAEE Cat. 3", "Datos sensibles"],
    ubicacion: "Medellín, El Poblado",
    frecuencia: "Única vez",
    volumen: "850",
    unidad: "kg",
    aplicantes: 7,
    tiempo: "Hace 35min",
  },
  {
    id: 3,
    tipo: "RCD",
    icono: Building2,
    nombre: "Escombros de demolición controlada",
    badges: ["Nuevo"],
    descripcion: "Material de demolición parcial de edificación comercial. Incluye concreto, ladrillo y estructura metálica mezclada.",
    tags: ["Res. 472/2017", "RCD Tipo A", "Aprovechable"],
    ubicacion: "Bogotá, Chapinero",
    frecuencia: "Semanal",
    volumen: "15",
    unidad: "m³",
    aplicantes: 2,
    tiempo: "Hace 1h",
  },
  {
    id: 4,
    tipo: "Hospitalario",
    icono: Beaker,
    nombre: "Residuos anatomopatológicos",
    badges: ["Urgente"],
    descripcion: "Residuos biosanitarios y anatomopatológicos de clínica veterinaria. Requiere incineración autorizada.",
    tags: ["Decreto 351/2014", "Riesgo biológico", "Cat. A"],
    ubicacion: "Cali, San Fernando",
    frecuencia: "Semanal",
    volumen: "180",
    unidad: "kg",
    aplicantes: 3,
    tiempo: "Hace 4h",
  },
  {
    id: 5,
    tipo: "Orgánico",
    icono: Leaf,
    nombre: "Residuos orgánicos de restaurante",
    badges: ["Destacado"],
    descripcion: "Restos de alimentos y residuos de cocina de cadena de 5 restaurantes. Ideal para compostaje industrial.",
    tags: ["PGIRS", "Aprovechable", "Compostable"],
    ubicacion: "Barranquilla, Norte",
    frecuencia: "Diaria",
    volumen: "400",
    unidad: "kg",
    aplicantes: 9,
    tiempo: "Hace 15min",
  },
  {
    id: 6,
    tipo: "Especial",
    icono: Package,
    nombre: "Llantas usadas de flota vehicular",
    badges: ["Nuevo", "Destacado"],
    descripcion: "Lote de 200 llantas de vehículos pesados para programa posconsumo o coprocesamiento.",
    tags: ["Res. 1326/2017", "Posconsumo", "NFU"],
    ubicacion: "Bucaramanga, Industrial",
    frecuencia: "Mensual",
    volumen: "3,200",
    unidad: "kg",
    aplicantes: 5,
    tiempo: "Hace 50min",
  },
];

const FILTER_TIPOS = [
  { label: "RESPEL", icon: Flame, active: false },
  { label: "RAEE", icon: Cpu, active: false },
  { label: "RCD", icon: Building2, active: false },
  { label: "Hospitalario", icon: Beaker, active: false },
  { label: "Orgánico", icon: Leaf, active: false },
  { label: "Especial", icon: Package, active: false },
];

const AVATAR_COLORS = [
  "bg-emerald-700/60",
  "bg-teal-700/60",
  "bg-green-700/60",
  "bg-cyan-700/60",
  "bg-lime-700/60",
];

const AVATAR_INITIALS = ["GR", "EC", "AM", "RS", "VE", "TQ", "LM", "CP", "BI"];

function getBadgeStyle(badge: string) {
  if (badge === "Urgente")
    return "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20";
  if (badge === "Nuevo")
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20";
  if (badge === "Destacado")
    return "bg-purple-500/15 text-purple-400 border-purple-500/30 hover:bg-purple-500/20";
  return "";
}

function getBadgeIcon(badge: string) {
  if (badge === "Urgente") return <Zap className="h-3 w-3" />;
  if (badge === "Nuevo") return <Sparkles className="h-3 w-3" />;
  if (badge === "Destacado") return <Star className="h-3 w-3" />;
  return null;
}

function ListingCard({ listing }: { listing: (typeof MOCK_LISTINGS)[0] }) {
  const Icon = listing.icono;
  return (
    <div
      className="group rounded-xl p-5 transition-all duration-300 hover:-translate-y-0.5"
      style={{
        background: "#111f15",
        border: "0.5px solid rgba(29,158,117,0.15)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "rgba(29,158,117,0.4)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "rgba(29,158,117,0.15)")
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(29,158,117,0.12)" }}
          >
            <Icon className="h-5 w-5" style={{ color: "#1D9E75" }} />
          </div>
          <div>
            <span
              className="text-xs font-medium tracking-wide uppercase"
              style={{ color: "#5DCAA5" }}
            >
              {listing.tipo}
            </span>
            <h4 className="text-sm font-semibold text-white leading-tight">
              {listing.nombre}
            </h4>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          {listing.badges.map((b) => (
            <Badge
              key={b}
              className={`text-[10px] px-2 py-0.5 gap-1 border ${getBadgeStyle(b)}`}
            >
              {getBadgeIcon(b)}
              {b}
            </Badge>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-3" style={{ color: "#8ba698" }}>
        {listing.descripcion}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {listing.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: "rgba(29,158,117,0.08)",
              color: "#5DCAA5",
              border: "1px solid rgba(29,158,117,0.12)",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 mb-4 text-[11px]" style={{ color: "#6b8f7b" }}>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" /> {listing.ubicacion}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {listing.frecuencia}
        </span>
      </div>

      {/* Volume + Applicants + CTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Volume */}
          <div>
            <span className="text-lg font-bold text-white">
              {listing.volumen}
            </span>
            <span className="text-xs ml-1" style={{ color: "#5DCAA5" }}>
              {listing.unidad}
            </span>
          </div>

          {/* Avatar group */}
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {Array.from({ length: Math.min(listing.aplicantes, 4) }).map(
                (_, i) => (
                  <Avatar
                    key={i}
                    className={`h-7 w-7 border-2 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                    style={{ borderColor: "#111f15" }}
                  >
                    <AvatarFallback
                      className={`text-[9px] font-semibold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                    >
                      {AVATAR_INITIALS[i]}
                    </AvatarFallback>
                  </Avatar>
                )
              )}
              {listing.aplicantes > 4 && (
                <Avatar
                  className="h-7 w-7 border-2 bg-white/5"
                  style={{ borderColor: "#111f15" }}
                >
                  <AvatarFallback
                    className="text-[9px] font-semibold bg-white/10"
                    style={{ color: "#5DCAA5" }}
                  >
                    +{listing.aplicantes - 4}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <span
              className="text-[10px] ml-2 hidden sm:inline"
              style={{ color: "#6b8f7b" }}
            >
              {listing.aplicantes} gestores
            </span>
          </div>
        </div>

        <Button
          size="sm"
          className="h-8 px-3 text-xs font-semibold rounded-lg gap-1 transition-all"
          style={{
            background: "rgba(29,158,117,0.15)",
            color: "#1D9E75",
            border: "1px solid rgba(29,158,117,0.25)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(29,158,117,0.3)";
            e.currentTarget.style.borderColor = "rgba(29,158,117,0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(29,158,117,0.15)";
            e.currentTarget.style.borderColor = "rgba(29,158,117,0.25)";
          }}
        >
          Aplicar <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Timestamp */}
      <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(29,158,117,0.08)" }}>
        <span className="text-[10px]" style={{ color: "#4a6b5a" }}>
          {listing.tiempo}
        </span>
      </div>
    </div>
  );
}

export default function MarketplaceSection() {
  const [activeTab, setActiveTab] = useState("disponibles");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const toggleFilter = (label: string) => {
    setSelectedFilters((prev) =>
      prev.includes(label) ? prev.filter((f) => f !== label) : [...prev, label]
    );
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside
            className="w-full lg:w-64 shrink-0 rounded-xl p-5 self-start lg:sticky lg:top-24"
            style={{
              background: "#111f15",
              border: "0.5px solid rgba(29,158,117,0.15)",
            }}
          >
            {/* Search */}
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-5"
              style={{ background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.12)" }}
            >
              <Search className="h-4 w-4" style={{ color: "#5DCAA5" }} />
              <span className="text-xs" style={{ color: "#6b8f7b" }}>
                Buscar residuos...
              </span>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5DCAA5" }}>
              Tipo de residuo
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_TIPOS.map((f) => {
                const active = selectedFilters.includes(f.label);
                return (
                  <button
                    key={f.label}
                    onClick={() => toggleFilter(f.label)}
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-full transition-all"
                    style={{
                      background: active ? "rgba(29,158,117,0.2)" : "rgba(29,158,117,0.06)",
                      color: active ? "#1D9E75" : "#6b8f7b",
                      border: `1px solid ${active ? "rgba(29,158,117,0.4)" : "rgba(29,158,117,0.1)"}`,
                    }}
                  >
                    <f.icon className="h-3 w-3" />
                    {f.label}
                  </button>
                );
              })}
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "#5DCAA5" }}>
              Frecuencia
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {["Diaria", "Semanal", "Quincenal", "Mensual", "Única vez"].map((f) => (
                <span
                  key={f}
                  className="text-[11px] px-2.5 py-1.5 rounded-full cursor-pointer transition-all"
                  style={{
                    background: "rgba(29,158,117,0.06)",
                    color: "#6b8f7b",
                    border: "1px solid rgba(29,158,117,0.1)",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div
              className="rounded-lg p-4 mt-2"
              style={{ background: "rgba(29,158,117,0.06)", border: "1px solid rgba(29,158,117,0.1)" }}
            >
              <h4 className="text-[10px] uppercase tracking-wider font-semibold mb-3" style={{ color: "#5DCAA5" }}>
                Actividad hoy
              </h4>
              <div className="space-y-2.5">
                {[
                  { icon: FileText, label: "Publicaciones nuevas", value: "23" },
                  { icon: Users, label: "Gestores activos", value: "87" },
                  { icon: TrendingUp, label: "Ofertas enviadas", value: "142" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6b8f7b" }}>
                      <s.icon className="h-3 w-3" /> {s.label}
                    </span>
                    <span className="text-xs font-bold text-white">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
              <TabsList
                className="w-full justify-start gap-1 rounded-xl p-1.5 h-auto flex-wrap"
                style={{ background: "#111f15", border: "0.5px solid rgba(29,158,117,0.15)" }}
              >
                {[
                  { value: "disponibles", label: "Residuos disponibles", count: 156 },
                  { value: "publicaciones", label: "Mis publicaciones", count: null },
                  { value: "ofertas", label: "Ofertas recibidas", count: 12 },
                  { value: "contratos", label: "Contratos activos", count: 3 },
                ].map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="text-xs font-medium px-3 py-2 rounded-lg transition-all data-[state=active]:shadow-none"
                    style={{
                      color: activeTab === tab.value ? "#fff" : "#6b8f7b",
                      background: activeTab === tab.value ? "rgba(29,158,117,0.2)" : "transparent",
                    }}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span
                        className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{
                          background: activeTab === tab.value ? "rgba(29,158,117,0.3)" : "rgba(29,158,117,0.1)",
                          color: activeTab === tab.value ? "#1D9E75" : "#4a6b5a",
                        }}
                      >
                        {tab.count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Header bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
              <span className="text-sm" style={{ color: "#6b8f7b" }}>
                <span className="font-semibold text-white">156</span> residuos disponibles
              </span>
              <div className="flex items-center gap-3">
                <button
                  className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "rgba(29,158,117,0.06)",
                    color: "#6b8f7b",
                    border: "1px solid rgba(29,158,117,0.1)",
                  }}
                >
                  <ArrowUpDown className="h-3 w-3" /> Más recientes
                </button>
                <Button
                  className="h-9 px-4 text-xs font-bold rounded-lg gap-1.5"
                  style={{
                    background: "#1D9E75",
                    color: "#fff",
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Publicar residuo
                </Button>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MOCK_LISTINGS.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
