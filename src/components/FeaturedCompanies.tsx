import { MapPin, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import quimicleanLogo from "@/assets/logos/quimiclean.png";
import metalreciclaLogo from "@/assets/logos/metalrecicla.png";
import ecoplastLogo from "@/assets/logos/ecoplast.png";
import biogestorLogo from "@/assets/logos/biogestor.png";
import techrecycleLogo from "@/assets/logos/techrecycle.png";
import solverdeLogo from "@/assets/logos/solverde.png";

interface Company {
  name: string;
  type: "Recolector" | "Generador";
  residues: string[];
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  logo: string;
  tagline: string;
}

const companies: Company[] = [
  {
    name: "QuimiClean SA",
    type: "Recolector",
    residues: ["Aceites usados", "Químicos"],
    location: "Ciudad de México",
    rating: 4.9,
    reviews: 127,
    verified: true,
    logo: quimicleanLogo,
    tagline: "Gestión integral de residuos químicos industriales",
  },
  {
    name: "MetalRecicla Corp",
    type: "Recolector",
    residues: ["Metales", "Chatarra industrial"],
    location: "Monterrey",
    rating: 4.8,
    reviews: 98,
    verified: true,
    logo: metalreciclaLogo,
    tagline: "Reciclaje y valorización de metales ferrosos y no ferrosos",
  },
  {
    name: "EcoPlast Industrial",
    type: "Recolector",
    residues: ["Plásticos industriales", "Embalajes"],
    location: "Guadalajara",
    rating: 4.7,
    reviews: 84,
    verified: true,
    logo: ecoplastLogo,
    tagline: "Transformación sostenible de plásticos post-industriales",
  },
  {
    name: "BioGestor Pro",
    type: "Recolector",
    residues: ["Orgánicos", "Residuos alimentarios"],
    location: "Puebla",
    rating: 4.9,
    reviews: 156,
    verified: true,
    logo: biogestorLogo,
    tagline: "Compostaje y biodigestión de residuos orgánicos",
  },
  {
    name: "TechRecycle MX",
    type: "Recolector",
    residues: ["Electrónicos", "Baterías"],
    location: "Querétaro",
    rating: 4.6,
    reviews: 63,
    verified: true,
    logo: techrecycleLogo,
    tagline: "Disposición certificada de RAEE y baterías",
  },
  {
    name: "SolVerde Ambiental",
    type: "Recolector",
    residues: ["Solventes", "Residuos peligrosos"],
    location: "León",
    rating: 4.8,
    reviews: 112,
    verified: true,
    logo: solverdeLogo,
    tagline: "Manejo seguro de residuos peligrosos con licencia ambiental",
  },
];

const FeaturedCompanies = () => {
  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: "hsl(90, 30%, 95%)" }}>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <h2
              className="text-3xl md:text-4xl font-bold mb-2"
              style={{ color: "hsl(105, 25%, 14%)" }}
            >
              Empresas que trabajan con nosotros
            </h2>
            <p style={{ color: "hsl(105, 15%, 27%)" }} className="text-lg">
              Gestores verificados que ya confían en nuestra plataforma.
            </p>
          </div>
          <a
            href="#"
            className="text-sm font-medium hover:underline"
            style={{ color: "hsl(105, 35%, 38%)" }}
          >
            Ver todos los gestores →
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((company) => (
            <div
              key={company.name}
              className="bg-card rounded-xl border border-border/40 overflow-hidden cursor-pointer group transition-all duration-300 hover:-translate-y-1"
              style={{
                boxShadow: "0 1px 4px hsl(105 25% 14% / 0.06), 0 6px 20px -6px hsl(105 25% 14% / 0.08)",
              }}
            >
              {/* Logo banner area - Fiverr style */}
              <div
                className="relative h-44 flex items-center justify-center"
                style={{ backgroundColor: "hsl(150, 30%, 96%)" }}
              >
                <img
                  src={company.logo}
                  alt={`Logo de ${company.name}`}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="h-28 w-28 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
                {company.verified && (
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: "hsl(105, 35%, 38%)",
                      color: "hsl(0, 0%, 100%)",
                    }}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verificado
                  </div>
                )}
              </div>

              {/* Card body */}
              <div className="p-4">
                {/* Company name & tagline */}
                <h3
                  className="font-semibold text-sm mb-1 transition-colors group-hover:text-primary"
                  style={{ color: "hsl(105, 25%, 14%)" }}
                >
                  {company.name}
                </h3>
                <p className="text-xs mb-3 line-clamp-2" style={{ color: "hsl(105, 12%, 45%)" }}>
                  {company.tagline}
                </p>

                {/* Residues tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {company.residues.map((r) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="text-[11px] font-normal border-0"
                      style={{
                        backgroundColor: "hsl(150, 30%, 96%)",
                        color: "hsl(105, 15%, 27%)",
                      }}
                    >
                      {r}
                    </Badge>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" style={{ color: "hsl(105, 12%, 45%)" }} />
                    <span className="text-xs" style={{ color: "hsl(105, 12%, 45%)" }}>
                      {company.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span
                      className="text-sm font-bold"
                      style={{ color: "hsl(105, 25%, 14%)" }}
                    >
                      {company.rating}
                    </span>
                    <span className="text-xs" style={{ color: "hsl(105, 12%, 45%)" }}>
                      ({company.reviews})
                    </span>
                  </div>
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
