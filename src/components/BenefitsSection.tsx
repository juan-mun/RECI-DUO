import { Scale, BadgeCheck, Zap, Leaf, Clock, BarChart3 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const benefits = [
  { icon: Scale, title: "Cumplimiento legal garantizado", desc: "Opera con total certeza sabiendo que cada gestor cumple la normativa ambiental." },
  { icon: BadgeCheck, title: "Red verificada, no autoevaluada", desc: "Validación documental humana antes de aparecer en la plataforma." },
  { icon: Zap, title: "Conexión en menos de 24h", desc: "Matching inteligente por tipo de residuo, ciudad y capacidad." },
  { icon: Leaf, title: "Economía circular real", desc: "El 80%+ de residuos gestionados son aprovechados o reciclados." },
  { icon: Clock, title: "Ahorra tiempo y dinero", desc: "Sin intermediarios. Compara, elige y contrata en minutos." },
  { icon: BarChart3, title: "Trazabilidad completa", desc: "Historial de manifiestos para auditorías y reportes ESG." },
];

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="beneficios" className="py-20 md:py-28" style={{ backgroundColor: "#050f07" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#5DCAA5" }}>POR QUÉ RECI-DUO</p>
          <h2 className="text-section font-headline text-white mb-4">Lo que ningún directorio te da.</h2>
          <p className="text-lg" style={{ color: "hsl(150,15%,55%)" }}>
            No somos un listado. Somos la infraestructura de cumplimiento.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className={`rounded-2xl p-6 group cursor-pointer transition-all duration-500 hover:-translate-y-[3px] ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                backgroundColor: "#111f15",
                border: "0.5px solid rgba(29,158,117,0.15)",
                transitionDelay: isVisible ? `${i * 80}ms` : "0ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(29,158,117,0.4)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(29,158,117,0.15)")}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors"
                style={{ backgroundColor: "rgba(29,158,117,0.1)" }}>
                <b.icon className="h-6 w-6 group-hover:rotate-[360deg] transition-transform duration-500" style={{ color: "#5DCAA5" }} />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: "#f0f4f1" }}>{b.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(150,15%,55%)" }}>{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
