import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";
import impactoImg from "@/assets/impacto.png";

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-grid-pattern" style={{ backgroundColor: "#0a1a0f" }}>
      {/* Left image — circular economy */}
      <div className="absolute left-0 top-0 bottom-0 w-[40%] hidden lg:block pointer-events-none overflow-visible">
        <img
          src={impactoImg}
          alt="Ciclo de economía circular"
          className="absolute top-1/2 left-0 w-full h-auto max-w-none"
          style={{
            mixBlendMode: "screen",
            transform: "translateY(-50%)",
            WebkitMaskImage: "linear-gradient(to right, black 50%, transparent 90%)",
            maskImage: "linear-gradient(to right, black 50%, transparent 90%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className={`lg:ml-auto lg:max-w-[55%] text-center lg:text-left transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-section font-headline leading-tight mb-4">
            <span className="block font-light" style={{ color: "hsl(150,15%,60%)" }}>¿Tu empresa genera residuos?</span>
            <span className="block text-white">Empieza hoy, sin riesgo.</span>
          </h2>
          <p className="text-lg mb-8" style={{ color: "hsl(150,15%,55%)" }}>
            Más de 500 empresas ya operan legalmente con RECI-DUO.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-6">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] rounded-xl px-8 h-12 text-base font-semibold w-full sm:w-auto transition-all"
                style={{ animation: "pulseRing 3s ease-out infinite 2s" }}>
                Registrar mi empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base bg-transparent hover:bg-white/5 w-full sm:w-auto"
                style={{ borderColor: "rgba(240,244,241,0.2)", color: "hsl(150,15%,60%)" }}>
                Ver cómo funciona
              </Button>
            </a>
          </div>
          <p className={`text-xs font-mono transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}
            style={{ color: "hsl(150,15%,40%)" }}>
            Sin costo de registro · Sin permanencia forzosa · Soporte en español
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
