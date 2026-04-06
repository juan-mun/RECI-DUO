import { ShieldAlert, TrendingDown, Clock, ShieldCheck, Settings } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import benefitsImage from "@/assets/images/waste-management.jpeg";

const benefits = [
  { icon: ShieldAlert, title: "Evita multas ambientales", desc: "Cumple con toda la normativa vigente y evita sanciones costosas." },
  { icon: TrendingDown, title: "Reduce costos operativos", desc: "Compara ofertas de gestores y elige la más competitiva." },
  { icon: Clock, title: "Ahorra tiempo", desc: "Automatiza la búsqueda, contratación y certificación en un solo lugar." },
  { icon: ShieldCheck, title: "Empresas verificadas", desc: "Trabaja solo con gestores 100% certificados y con documentación al día." },
  { icon: Settings, title: "Optimización total", desc: "Dashboards, reportes y trazabilidad completa de cada residuo." },
];

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section
      id="beneficios"
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ backgroundColor: "#f4f7f0" }}
    >
      {/* Background image with blur */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${benefitsImage})`,
          opacity: 0.06,
          filter: "blur(2px)",
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div
          ref={ref}
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest uppercase font-medium mb-3" style={{ color: "#5a8a3c" }}>
              ¿Por qué RECI-DUO?
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline" style={{ color: "#1c2b1a" }}>
              Beneficios que impactan tu operación
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#3d4f38" }}>
              No solo cumples la ley — ahorras dinero y optimizas procesos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-border/40 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: "hsl(105, 35%, 38% / 0.1)" }}
                >
                  <b.icon className="h-6 w-6" style={{ color: "#5a8a3c" }} />
                </div>
                <h3 className="font-semibold mb-2" style={{ color: "#1c2b1a" }}>{b.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7f63" }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
