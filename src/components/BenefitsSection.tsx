import { Scale, BadgeCheck, Zap, Leaf, Clock, BarChart3 } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const benefits = [
  { icon: Scale, title: "Cumplimiento legal garantizado", desc: "Cada gestor cumple al 100% con normativa ambiental vigente. Sabes con quién operas." },
  { icon: BadgeCheck, title: "Red verificada, no autoevaluada", desc: "Validación documental humana antes de aparecer en la plataforma." },
  { icon: Zap, title: "Conexión en menos de 24h", desc: "Matching inteligente por tipo de residuo, ciudad y capacidad." },
  { icon: Leaf, title: "Economía circular real", desc: "El 80%+ de residuos gestionados son aprovechados o reciclados." },
  { icon: Clock, title: "Ahorra tiempo y dinero", desc: "Sin intermediarios. Compara, elige y contrata en minutos." },
  { icon: BarChart3, title: "Trazabilidad completa", desc: "Historial de manifiestos para auditorías y reportes ESG." },
];

const BenefitsSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="beneficios" className="py-20 md:py-28" style={{ backgroundColor: "hsl(130,12%,97%)" }}>
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">POR QUÉ RECI-DUO</p>
          <h2 className="text-section font-headline text-foreground mb-4">Lo que ningún directorio te da</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            No somos un listado. Somos la infraestructura de cumplimiento.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={i}
              className={`bg-card rounded-2xl p-6 border border-border/50 group cursor-pointer transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: isVisible ? `${i * 80}ms` : "0ms" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <b.icon className="h-6 w-6 text-primary group-hover:rotate-[360deg] transition-transform duration-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
