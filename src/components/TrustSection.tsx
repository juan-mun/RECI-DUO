import { Search, UserCheck, RefreshCw, ShieldCheck, Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useRef, useState } from "react";

const leftFeatures = [
  { icon: Search, title: "Revisión de certificaciones", desc: "Certificados ambientales, licencias SEMARNAT y permisos vigentes." },
  { icon: UserCheck, title: "Validación humana", desc: "Equipo especializado en normativa revisa cada expediente manualmente." },
  { icon: RefreshCw, title: "Monitoreo continuo", desc: "Si una cert vence, el gestor se suspende automáticamente." },
];

const checklist = [
  "Certificados ambientales",
  "Licencias de operación",
  "Permisos vigentes",
  "Seguros de responsabilidad",
  "Historial sin sanciones",
];

function useCountUp(target: number, duration = 1800, trigger = false) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!trigger || done.current) return;
    done.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration]);
  return val;
}

const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.15);
  const bigNum = useCountUp(100, 1800, isVisible);

  return (
    <section id="confianza" className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4" ref={ref}>
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-3">CONFIANZA</p>
          <h2 className="text-section font-headline text-foreground mb-4">Verificación que no es marketing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Cada gestor pasa por un proceso riguroso antes de ser aprobado.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left features */}
          <div className="space-y-6">
            {leftFeatures.map((f, i) => (
              <div
                key={i}
                className={`flex gap-4 transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
                }`}
                style={{ transitionDelay: isVisible ? `${200 + i * 150}ms` : "0ms" }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right stat card */}
          <div className={`transition-all duration-700 delay-300 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <div className="rounded-2xl border-2 border-primary/20 bg-card p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <p className="font-headline text-6xl md:text-7xl text-primary mb-2">{bigNum}%</p>
              <p className="text-lg font-medium text-foreground mb-6">Empresas verificadas antes de operar</p>
              <div className="space-y-3">
                {checklist.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: isVisible ? `${500 + i * 150}ms` : "0ms" }}
                  >
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
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
