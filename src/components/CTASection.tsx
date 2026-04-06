import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import greenCityImage from "@/assets/images/green-city.jpeg";

const CTASection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`relative rounded-3xl overflow-hidden transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${greenCityImage})`,
              opacity: 0.15,
              filter: "blur(1px)",
            }}
          />
          {/* Green overlay */}
          <div className="absolute inset-0 eco-gradient-bg opacity-90" />

          <div className="relative z-10 p-10 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-headline">
              Empieza a gestionar tus residuos hoy
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Sé parte de la solución. Registra tu empresa y conecta con gestores certificados en menos de 24 horas.
            </p>
            <Link to="/auth">
              <Button
                size="lg"
                className="bg-white text-foreground hover:bg-white/90 h-12 px-8 text-base font-semibold rounded-full"
              >
                Registrar mi empresa
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
