import { Quote, Star } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const UseCaseSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center mb-4">
            <p className="text-sm tracking-widest uppercase font-medium mb-3" style={{ color: "#5a8a3c" }}>
              Prueba social
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl p-8 md:p-12" style={{ backgroundColor: "#f4f7f0" }}>
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="rounded-full p-2 flex-shrink-0" style={{ backgroundColor: "#5a8a3c" }}>
                  <Quote className="h-5 w-5 text-white" />
                </div>
                <p className="text-lg md:text-xl leading-relaxed" style={{ color: "#1c2b1a" }}>
                  "Reducimos nuestros costos de disposición en un <strong>30%</strong> gracias a RECI-DUO. La plataforma nos conectó con gestores certificados en menos de un día y ahora tenemos toda la trazabilidad documental automatizada."
                </p>
              </div>

              <div className="flex items-center gap-3 ml-14">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: "#5a8a3c" }}>
                  CM
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#1c2b1a" }}>Carlos Mejía</p>
                  <p className="text-xs" style={{ color: "#6b7f63" }}>Director de Operaciones, Industrias del Valle</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCaseSection;
