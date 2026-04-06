import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const UseCaseSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);

  return (
    <section className="py-20 md:py-28" style={{ backgroundColor: "hsl(150, 30%, 96%)" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div
          className={`max-w-3xl mx-auto transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95"
          }`}
        >
          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-full p-2" style={{ backgroundColor: "hsl(105, 35%, 38%)" }}>
                <Quote className="h-5 w-5" style={{ color: "hsl(0, 0%, 100%)" }} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: "hsl(105, 35%, 38%)" }}>Ejemplo real</span>
            </div>
            <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: "hsl(105, 25%, 14%)" }}>
              Un taller automotriz necesita desechar aceite usado. A través de la plataforma encuentra una empresa certificada que recoge y trata este residuo de forma ambientalmente responsable.
            </p>
            <div
              className="flex items-center gap-3 rounded-xl p-4 border"
              style={{ backgroundColor: "hsl(105, 35%, 38% / 0.05)", borderColor: "hsl(105, 35%, 38% / 0.1)" }}
            >
              <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: "hsl(105, 35%, 38%)" }} />
              <p className="text-sm font-medium" style={{ color: "hsl(105, 35%, 38%)" }}>
                Ahorra tiempo, cumple la ley y protege el medio ambiente
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCaseSection;
