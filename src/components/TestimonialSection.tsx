import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TestimonialSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="relative py-20 md:py-28 bg-dot-pattern" style={{ backgroundColor: "#050f07" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`max-w-[680px] mx-auto text-center transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
          {/* Large decorative quote mark */}
          <div className={`text-8xl leading-none mb-6 font-serif transition-all duration-500 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
            style={{ color: "rgba(29,158,117,0.15)" }}>
            "
          </div>

          <blockquote
            className={`text-xl md:text-2xl leading-relaxed font-light italic mb-8 transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
            style={{ color: "#f0f4f1" }}
          >
            Antes tardábamos semanas en encontrar un gestor certificado para nuestros aceites. Con RECI-DUO lo hicimos en un día y el proceso fue completamente legal desde el primer momento.
          </blockquote>

          <div className={`transition-all duration-700 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="font-semibold text-white">Carlos Méndez</p>
            <p className="text-xs font-mono" style={{ color: "hsl(150,15%,45%)" }}>Director de Operaciones · Taller Industrial del Norte</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;
