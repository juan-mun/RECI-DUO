import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TestimonialSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`max-w-[680px] mx-auto text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-8 transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}>
            <Quote className="h-7 w-7 text-primary" />
          </div>

          <blockquote
            className={`text-xl md:text-2xl leading-relaxed font-medium text-foreground mb-8 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            "Antes tardábamos semanas en encontrar un gestor certificado para nuestros aceites. Con RECI-DUO lo hicimos en un día y el proceso fue completamente legal desde el primer momento."
          </blockquote>

          <div className={`transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="font-semibold text-foreground">Carlos Méndez</p>
            <p className="text-sm text-muted-foreground">Director de Operaciones · Taller Industrial del Norte</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
