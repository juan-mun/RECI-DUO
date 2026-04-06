import { MapPin, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

import quimicleanLogo from "@/assets/logos/quimiclean.png";
import metalreciclaLogo from "@/assets/logos/metalrecicla.png";
import techrecycleLogo from "@/assets/logos/techrecycle.png";

const companies = [
  { name: "QuimicClean SA", desc: "Gestión integral de residuos químicos industriales", tags: ["Aceites usados", "Químicos"], location: "Ciudad de México", rating: 4.9, reviews: 127, logo: quimicleanLogo },
  { name: "MetalRecicla Corp", desc: "Reciclaje de metales ferrosos y no ferrosos", tags: ["Metales", "Chatarra industrial"], location: "Monterrey", rating: 4.8, reviews: 98, logo: metalreciclaLogo },
  { name: "TechRecycle MX", desc: "Disposición certificada de RAEE y baterías", tags: ["Electrónicos", "Baterías"], location: "Querétaro", rating: 4.6, reviews: 63, logo: techrecycleLogo },
];

const FeaturedCompanies = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="gestores" className="relative py-20 md:py-28 bg-grid-pattern" style={{ backgroundColor: "#0d1f12" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#5DCAA5" }}>GESTORES ACTIVOS</p>
          <h2 className="text-section font-headline text-white mb-4">Gestores que ya confían.</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, i) => (
            <div
              key={company.name}
              className={`rounded-2xl overflow-hidden group transition-all duration-700 hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                backgroundColor: "#111f15",
                border: "0.5px solid rgba(29,158,117,0.15)",
                transitionDelay: isVisible ? `${i * 100}ms` : "0ms",
              }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg object-contain" style={{ backgroundColor: "rgba(29,158,117,0.1)" }} />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{company.name}</h3>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" style={{ color: "hsl(150,15%,45%)" }} />
                        <span className="text-xs" style={{ color: "hsl(150,15%,45%)" }}>{company.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full"
                    style={{ backgroundColor: "#0d2a1a", border: "1px solid rgba(29,158,117,0.3)" }}>
                    <ShieldCheck className="h-3 w-3" style={{ color: "#5DCAA5" }} />
                    <span className="text-xs font-medium" style={{ color: "#5DCAA5" }}>Verificado</span>
                  </div>
                </div>

                <p className="text-sm mb-4 leading-relaxed" style={{ color: "hsl(150,15%,55%)" }}>{company.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {company.tags.map((tag) => (
                    <Badge key={tag} className="text-[11px] font-normal border-0 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "rgba(29,158,117,0.1)", color: "hsl(150,15%,60%)" }}>
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: "0.5px solid rgba(29,158,117,0.15)" }}>
                  <Star className="h-4 w-4" style={{ fill: "#FAC775", color: "#FAC775" }} />
                  <span className="text-sm font-bold text-white">{company.rating}</span>
                  <span className="text-xs" style={{ color: "hsl(150,15%,45%)" }}>({company.reviews} reseñas)</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center mt-10 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Button variant="outline" className="rounded-xl bg-transparent px-8 hover:bg-white/5"
            style={{ borderColor: "rgba(29,158,117,0.3)", color: "hsl(150,15%,60%)" }}>
            Ver todos los gestores →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCompanies;
