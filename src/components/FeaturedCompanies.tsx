import { MapPin, ShieldCheck, Star, Recycle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Company {
  name: string;
  type: "Recolector" | "Generador";
  residues: string[];
  location: string;
  rating: number;
  verified: boolean;
}

const companies: Company[] = [
  {
    name: "QuimiClean SA",
    type: "Recolector",
    residues: ["Aceites usados", "Químicos"],
    location: "Ciudad de México",
    rating: 4.9,
    verified: true,
  },
  {
    name: "MetalRecicla Corp",
    type: "Recolector",
    residues: ["Metales", "Chatarra industrial"],
    location: "Monterrey",
    rating: 4.8,
    verified: true,
  },
  {
    name: "EcoPlast Industrial",
    type: "Recolector",
    residues: ["Plásticos industriales", "Embalajes"],
    location: "Guadalajara",
    rating: 4.7,
    verified: true,
  },
  {
    name: "BioGestor Pro",
    type: "Recolector",
    residues: ["Orgánicos", "Residuos alimentarios"],
    location: "Puebla",
    rating: 4.9,
    verified: true,
  },
  {
    name: "TechRecycle MX",
    type: "Recolector",
    residues: ["Electrónicos", "Baterías"],
    location: "Querétaro",
    rating: 4.6,
    verified: true,
  },
  {
    name: "SolVerde Ambiental",
    type: "Recolector",
    residues: ["Solventes", "Residuos peligrosos"],
    location: "León",
    rating: 4.8,
    verified: true,
  },
];

const FeaturedCompanies = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Empresas que trabajan con nosotros
            </h2>
            <p className="text-muted-foreground text-lg">
              Gestores verificados que ya confían en nuestra plataforma.
            </p>
          </div>
          <a href="#" className="text-sm font-medium text-primary hover:underline">
            Ver todos los gestores →
          </a>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <div
              key={company.name}
              className="bg-card rounded-2xl border border-border/50 shadow-card hover:shadow-soft transition-all hover:-translate-y-0.5 cursor-pointer group overflow-hidden"
            >
              {/* Card header with gradient accent */}
              <div className="h-2 eco-gradient-bg" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Recycle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                        {company.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {company.location}
                      </div>
                    </div>
                  </div>
                  {company.verified && (
                    <div className="flex items-center gap-1 text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {company.residues.map((r) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="text-xs font-normal bg-eco-light text-muted-foreground border-0"
                    >
                      {r}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-semibold text-foreground">{company.rating}</span>
                  </div>
                  <span className="text-xs font-medium text-primary">Ver perfil →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCompanies;
