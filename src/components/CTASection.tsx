import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-20 md:py-28 animate-gradient-shift" style={{ backgroundColor: "hsl(160,72%,37%)" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center max-w-2xl mx-auto transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <h2 className="text-section font-headline text-white mb-4 leading-tight">
            ¿Tu empresa genera residuos?<br />Empieza hoy, sin riesgo.
          </h2>
          <p className="text-lg text-white/80 mb-8">
            Más de 500 empresas ya operan legalmente con RECI-DUO.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link to="/auth">
              <Button size="lg" className="bg-white text-foreground hover:bg-white/90 rounded-xl px-8 h-12 text-base font-semibold w-full sm:w-auto"
                style={{ animation: "pulseRing 3s ease-out infinite 2s" }}>
                Registrar mi empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#como-funciona">
              <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base bg-transparent hover:bg-white/10 border-white/30 text-white w-full sm:w-auto">
                Ver cómo funciona
              </Button>
            </a>
          </div>
          <p className={`text-sm text-white/60 transition-all duration-700 delay-500 ${isVisible ? "opacity-100" : "opacity-0"}`}>
            Sin costo de registro · Sin permanencia forzosa · Soporte en español
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
