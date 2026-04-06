import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="eco-gradient-bg rounded-3xl p-10 md:p-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Únete a la red sostenible
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8">
            Sé parte de la solución. Registra tu empresa y comienza a gestionar residuos de forma responsable.
          </p>
          <Button size="lg" className="bg-card text-foreground hover:bg-card/90 h-12 px-8 text-base font-semibold">
            Registrar empresa
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
