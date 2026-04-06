import { ShieldCheck, FileSearch, CheckCircle2 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.15);

  return (
    <section id="confianza" className="py-20 md:py-28" style={{ backgroundColor: "hsl(150, 30%, 96%)" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-700 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            }`}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(105, 25%, 14%)" }}>
              Empresas verificadas
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: "hsl(105, 15%, 27%)" }}>
              Todas las empresas pasan por un proceso de validación documental antes de ser aprobadas en la plataforma. Tu tranquilidad es nuestra prioridad.
            </p>
            <div className="space-y-4">
              {[
                { icon: FileSearch, text: "Revisión exhaustiva de certificaciones y licencias" },
                { icon: ShieldCheck, text: "Validación por expertos en normativa ambiental" },
                { icon: CheckCircle2, text: "Monitoreo continuo del estado de documentación" },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                  }`}
                  style={{ transitionDelay: isVisible ? `${300 + i * 150}ms` : "0ms" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "hsl(105, 35%, 38% / 0.1)" }}
                  >
                    <item.icon className="h-4 w-4" style={{ color: "hsl(105, 35%, 38%)" }} />
                  </div>
                  <p style={{ color: "hsl(105, 25%, 14%)" }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div
            className={`flex justify-center transition-all duration-700 delay-200 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
            }`}
          >
            <div className="bg-card rounded-3xl p-8 shadow-card border border-border/50 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="rounded-xl p-3" style={{ backgroundColor: "hsl(105, 35%, 38%)" }}>
                  <ShieldCheck className="h-8 w-8" style={{ color: "hsl(0, 0%, 100%)" }} />
                </div>
                <div>
                  <div className="font-bold text-lg" style={{ color: "hsl(105, 25%, 14%)" }}>100%</div>
                  <div className="text-sm" style={{ color: "hsl(105, 12%, 45%)" }}>Empresas verificadas</div>
                </div>
              </div>
              <div className="space-y-3">
                {["Certificados ambientales", "Licencias de operación", "Permisos vigentes", "Seguros de responsabilidad"].map((doc, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-lg p-3 transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{
                      backgroundColor: "hsl(105, 35%, 38% / 0.05)",
                      transitionDelay: isVisible ? `${400 + i * 100}ms` : "0ms",
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(105, 35%, 38%)" }} />
                    <span className="text-sm" style={{ color: "hsl(105, 25%, 14%)" }}>{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
