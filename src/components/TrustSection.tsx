import { ShieldCheck, FileSearch, CheckCircle2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import wasteProcessImage from "@/assets/images/waste-process.jpeg";

const TrustSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="confianza" className="py-24 md:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest uppercase font-medium mb-3" style={{ color: "#5a8a3c" }}>
              Confianza garantizada
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline" style={{ color: "#1c2b1a" }}>
              Trabaja solo con empresas 100% verificadas
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left — image */}
            <div className="flex justify-center order-2 lg:order-1">
              <img
                src={wasteProcessImage}
                alt="Proceso de gestión de residuos verificado"
                className="w-full max-w-md rounded-2xl"
                loading="lazy"
                style={{
                  opacity: 0.8,
                  filter: "drop-shadow(0 16px 32px rgba(60,100,40,0.1))",
                }}
              />
            </div>

            {/* Right — content */}
            <div className="order-1 lg:order-2">
              <p className="text-lg mb-8 leading-relaxed" style={{ color: "#3d4f38" }}>
                Todas las empresas pasan por un proceso de validación documental riguroso antes de ser aprobadas. Tu tranquilidad es nuestra prioridad.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: FileSearch, text: "Revisión exhaustiva de certificaciones y licencias" },
                  { icon: ShieldCheck, text: "Validación por expertos en normativa ambiental" },
                  { icon: CheckCircle2, text: "Monitoreo continuo del estado de documentación" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: "hsl(105, 35%, 38% / 0.1)" }}
                    >
                      <item.icon className="h-4 w-4" style={{ color: "#5a8a3c" }} />
                    </div>
                    <p style={{ color: "#1c2b1a" }}>{item.text}</p>
                  </div>
                ))}
              </div>

              {/* Verified docs card */}
              <div className="bg-white rounded-2xl p-6 border border-border/40 shadow-card max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="rounded-xl p-3" style={{ backgroundColor: "#5a8a3c" }}>
                    <ShieldCheck className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-lg" style={{ color: "#1c2b1a" }}>100%</div>
                    <div className="text-sm" style={{ color: "#6b7f63" }}>Empresas verificadas</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {["Certificados ambientales", "Licencias de operación", "Permisos vigentes", "Seguros de responsabilidad"].map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg p-2.5"
                      style={{ backgroundColor: "hsl(105, 35%, 38% / 0.05)" }}
                    >
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" style={{ color: "#5a8a3c" }} />
                      <span className="text-sm" style={{ color: "#1c2b1a" }}>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
