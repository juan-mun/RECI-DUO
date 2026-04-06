import { Scale, Users, Zap, Leaf, Clock } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const benefits = [
  { icon: Scale, title: "Cumplimiento legal garantizado", desc: "Opera con total tranquilidad sabiendo que cumples con toda la normativa ambiental vigente." },
  { icon: Users, title: "Red de empresas certificadas", desc: "Accede a un directorio verificado de gestores de residuos con todas sus credenciales al día." },
  { icon: Zap, title: "Optimización de procesos", desc: "Simplifica la gestión de residuos con herramientas digitales que ahorran pasos y papeleo." },
  { icon: Leaf, title: "Impacto ambiental positivo", desc: "Contribuye activamente a la economía circular y la protección del medio ambiente." },
  { icon: Clock, title: "Ahorro de tiempo y costos", desc: "Encuentra rápidamente al gestor adecuado sin intermediarios ni procesos engorrosos." },
];

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="beneficios" className="py-20 md:py-28" style={{ backgroundColor: "hsl(90, 30%, 95%)" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(105, 25%, 14%)" }}>Beneficios</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(105, 15%, 27%)" }}>
            Todo lo que necesitas para una gestión de residuos eficiente y responsable.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className={`bg-card rounded-2xl p-6 shadow-card hover:shadow-soft transition-all border border-border/50 group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                transitionDuration: "700ms",
                transitionDelay: isVisible ? `${i * 100}ms` : "0ms",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: "hsl(105, 35%, 38% / 0.1)" }}
              >
                <b.icon className="h-6 w-6" style={{ color: "hsl(105, 35%, 38%)" }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "hsl(105, 25%, 14%)" }}>{b.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(105, 12%, 45%)" }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
