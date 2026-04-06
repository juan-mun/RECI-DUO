import { MapPin, ShieldCheck, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Button } from "@/components/ui/button";

import quimicleanLogo from "@/assets/logos/quimiclean.png";
import metalreciclaLogo from "@/assets/logos/metalrecicla.png";
import techrecycleLogo from "@/assets/logos/techrecycle.png";

const companies = [
  {
    name: "QuimicClean SA",
    desc: "Gestión integral de residuos químicos industriales",
    tags: ["Aceites usados", "Químicos"],
    location: "Ciudad de México",
    rating: 4.9,
    reviews: 127,
    logo: quimicleanLogo,
  },
  {
    name: "MetalRecicla Corp",
    desc: "Reciclaje de metales ferrosos y no ferrosos",
    tags: ["Metales", "Chatarra industrial"],
    location: "Monterrey",
    rating: 4.8,
    reviews: 98,
    logo: metalreciclaLogo,
  },
  {
    name: "TechRecycle MX",
    desc: "Disposición certificada de RAEE y baterías",
    tags: ["Electrónicos", "Baterías"],
    location: "Querétaro",
    rating: 4.6,
    reviews: 63,
    logo: techrecycleLogo,
  },
];

const FeaturedCompanies = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="gestores" className="py-20 md:py-28" style={{ backgroundColor: "hsl(150,40%,5%)" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "hsl(160,55%,55%)" }}>GESTORES ACTIVOS</p>
          <h2 className="text-section font-headline text-white mb-4">Gestores que ya confían</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company, i) => (
            <div
              key={company.name}
              className={`rounded-2xl border overflow-hidden group transition-all duration-700 hover:-translate-y-1 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                backgroundColor: "hsl(150,30%,10%)",
                borderColor: "hsl(150,30%,18%)",
                transitionDelay: isVisible ? `${i * 100}ms` : "0ms",
              }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg object-contain" style={{ backgroundColor: "hsl(150,30%,15%)" }} />
                    <div>
                      <h3 className="font-semibold text-white text-sm">{company.name}</h3>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" style={{ color: "hsl(150,15%,45%)" }} />
                        <span className="text-xs" style={{ color: "hsl(150,15%,45%)" }}>{company.location}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: "hsl(160,72%,37%,0.15)" }}>
                    <ShieldCheck className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Verificado</span>
                  </div>
                </div>

                <p className="text-sm mb-4 leading-relaxed" style={{ color: "hsl(150,15%,55%)" }}>{company.desc}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {company.tags.map((tag) => (
                    <Badge key={tag} className="text-[11px] font-normal border-0 hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: "hsl(150,30%,15%)", color: "hsl(150,15%,60%)" }}>
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 pt-3 border-t" style={{ borderColor: "hsl(150,30%,15%)" }}>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-white">{company.rating}</span>
                  <span className="text-xs" style={{ color: "hsl(150,15%,45%)" }}>({company.reviews} reseñas)</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className={`text-center mt-10 transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <Button variant="outline" className="rounded-xl border-white/20 text-white bg-transparent hover:bg-white/5 px-8">
            Ver todos los gestores →
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCompanies;
