import { ClipboardList, FileText, ShieldCheck, Handshake, Recycle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  { num: "01", icon: ClipboardList, title: "Registra tu empresa", desc: "Crea tu perfil. Indica qué residuos generas." },
  { num: "02", icon: FileText, title: "Sube documentación", desc: "Certificaciones, licencias y permisos." },
  { num: "03", icon: ShieldCheck, title: "Validamos todo", desc: "Expertos en normativa ambiental revisan." },
  { num: "04", icon: Handshake, title: "Conecta con gestores", desc: "Matching por tipo de residuo y ciudad." },
  { num: "05", icon: Recycle, title: "Gestiona y reporta", desc: "Manifiestos y bitácoras automáticas." },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">PROCESO SIMPLE</p>
          <h2 className="text-section font-headline text-foreground mb-4">En 5 pasos, cumples la ley</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sin reuniones, sin trámites manuales. Todo digital y verificado.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5">
            <div
              className="h-full bg-primary/20 rounded-full transition-all duration-[1.5s] ease-out"
              style={{
                transformOrigin: "left",
                transform: isVisible ? "scaleX(1)" : "scaleX(0)",
              }}
            />
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {steps.map((step, i) => (
              <div
                key={i}
                className={`relative flex flex-col items-center text-center transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: isVisible ? `${300 + i * 120}ms` : "0ms" }}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-500 ${
                  isVisible ? "scale-100" : "scale-0"
                } bg-primary shadow-lg shadow-primary/20`}
                  style={{ transitionDelay: isVisible ? `${400 + i * 150}ms` : "0ms" }}
                >
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                <span className="text-xs font-bold text-primary mb-2">{step.num}</span>
                <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
