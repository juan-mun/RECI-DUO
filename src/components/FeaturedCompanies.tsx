import { MapPin, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useScrollReveal } from "@/hooks/useScrollReveal";

import quimicleanLogo from "@/assets/logos/quimiclean.png";
import metalreciclaLogo from "@/assets/logos/metalrecicla.png";
import ecoplastLogo from "@/assets/logos/ecoplast.png";
import biogestorLogo from "@/assets/logos/biogestor.png";
import techrecycleLogo from "@/assets/logos/techrecycle.png";
import solverdeLogo from "@/assets/logos/solverde.png";

interface Company {
  name: string;
  residues: string[];
  location: string;
  rating: number;
  reviews: number;
  logo: string;
  tagline: string;
}

const companies: Company[] = [
  { name: "QuimiClean SA", residues: ["Aceites usados", "Químicos"], location: "Ciudad de México", rating: 4.9, reviews: 127, logo: quimicleanLogo, tagline: "Gestión integral de residuos químicos industriales" },
  { name: "MetalRecicla Corp", residues: ["Metales", "Chatarra industrial"], location: "Monterrey", rating: 4.8, reviews: 98, logo: metalreciclaLogo, tagline: "Reciclaje y valorización de metales ferrosos" },
  { name: "EcoPlast Industrial", residues: ["Plásticos industriales", "Embalajes"], location: "Guadalajara", rating: 4.7, reviews: 84, logo: ecoplastLogo, tagline: "Transformación sostenible de plásticos post-industriales" },
  { name: "BioGestor Pro", residues: ["Orgánicos", "Residuos alimentarios"], location: "Puebla", rating: 4.9, reviews: 156, logo: biogestorLogo, tagline: "Compostaje y biodigestión de residuos orgánicos" },
  { name: "TechRecycle MX", residues: ["Electrónicos", "Baterías"], location: "Querétaro", rating: 4.6, reviews: 63, logo: techrecycleLogo, tagline: "Disposición certificada de RAEE y baterías" },
  { name: "SolVerde Ambiental", residues: ["Solventes", "Residuos peligrosos"], location: "León", rating: 4.8, reviews: 112, logo: solverdeLogo, tagline: "Manejo seguro de residuos peligrosos" },
];

const FeaturedCompanies = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 md:py-32" style={{ backgroundColor: "#f4f7f0" }}>
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-sm tracking-widest uppercase font-medium mb-3" style={{ color: "#5a8a3c" }}>
                Red certificada
              </p>
              <h2 className="text-3xl md:text-4xl font-bold mb-2 font-headline" style={{ color: "#1c2b1a" }}>
                Empresas que trabajan con nosotros
              </h2>
              <p style={{ color: "#3d4f38" }} className="text-lg">
                Gestores verificados que ya confían en nuestra plataforma.
              </p>
            </div>
            <a href="#" className="text-sm font-medium hover:underline" style={{ color: "#5a8a3c" }}>
              Ver todos los gestores →
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((company, i) => (
              <div
                key={company.name}
                className="bg-white rounded-xl border border-border/40 overflow-hidden cursor-pointer group hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="relative h-48 flex items-center justify-center" style={{ backgroundColor: "hsl(150, 30%, 96%)" }}>
                  <img
                    src={company.logo}
                    alt={`Logo de ${company.name}`}
                    loading="lazy"
                    className="h-40 w-40 object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: "#5a8a3c" }}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verificado
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors" style={{ color: "#1c2b1a" }}>
                    {company.name}
                  </h3>
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "#6b7f63" }}>{company.tagline}</p>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {company.residues.map((r) => (
                      <Badge key={r} variant="secondary" className="text-[11px] font-normal border-0" style={{ backgroundColor: "hsl(150, 30%, 96%)", color: "#3d4f38" }}>
                        {r}
                      </Badge>
                    ))}
                  </div>

                  <div className="border-t border-border/40 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" style={{ color: "#6b7f63" }} />
                      <span className="text-xs" style={{ color: "#6b7f63" }}>{company.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold" style={{ color: "#1c2b1a" }}>{company.rating}</span>
                      <span className="text-xs" style={{ color: "#6b7f63" }}>({company.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCompanies;
