import { ClipboardList, FileText, ShieldCheck, Handshake, Recycle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import procesoImg from "@/assets/proceso.png";

const steps = [
  { num: "01", icon: ClipboardList, title: "Registra tu empresa", desc: "Crea tu perfil en 5 minutos." },
  { num: "02", icon: FileText, title: "Sube documentación", desc: "Certificaciones, licencias y permisos." },
  { num: "03", icon: ShieldCheck, title: "Validamos todo", desc: "Expertos en normativa SEMARNAT." },
  { num: "04", icon: Handshake, title: "Conecta con gestores", desc: "Matching por tipo de residuo y ciudad." },
  { num: "05", icon: Recycle, title: "Gestiona y reporta", desc: "Manifiestos digitales automáticos." },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollAnimation(0.1);

  return (
    <section id="como-funciona" className="relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: "#0d1f12" }}>
      {/* Right image with mix-blend-mode screen */}
      <div className="absolute right-0 top-0 bottom-0 w-[50%] hidden lg:block pointer-events-none overflow-visible">
        <img
          src={procesoImg}
          alt="Flujo de recolección de residuos"
          className="absolute top-1/2 right-0 w-full h-auto max-w-none"
          style={{
            mixBlendMode: "screen",
            transform: `translateY(-50%)`,
            WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 90%)",
            maskImage: "linear-gradient(to left, black 40%, transparent 90%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className="lg:max-w-[50%]">
          <div className={`mb-12 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#5DCAA5" }}>PROCESO SIMPLE</p>
            <h2 className="text-section font-headline text-white mb-4 leading-tight">
              En 5 pasos,<br />cumples la ley.
            </h2>
            <p className="text-lg" style={{ color: "hsl(150,15%,60%)" }}>
              Sin reuniones, sin trámites manuales. Todo digital y verificado.
            </p>
          </div>

          {/* Vertical steps with connector line */}
          <div className="relative pl-8">
            {/* Animated connector line */}
            <div className="absolute left-3 top-0 bottom-0 w-px">
              <div
                className="h-full w-full transition-all duration-[1.5s] ease-out"
                style={{
                  backgroundColor: "rgba(29,158,117,0.3)",
                  transformOrigin: "top",
                  transform: isVisible ? "scaleY(1)" : "scaleY(0)",
                }}
              />
            </div>

            <div className="space-y-8">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className={`relative flex items-start gap-5 transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: isVisible ? `${300 + i * 120}ms` : "0ms" }}
                >
                  {/* Dot on line */}
                  <div className="absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "#0d1f12", border: "2px solid rgba(29,158,117,0.5)" }}>
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isVisible ? "scale-100" : "scale-0"}`}
                      style={{ backgroundColor: "#1D9E75", transitionDelay: `${400 + i * 150}ms` }} />
                  </div>

                  <div>
                    <span className="text-xs font-mono font-bold mb-1 block" style={{ color: "#5DCAA5" }}>{step.num}</span>
                    <h3 className="font-semibold text-white mb-1">{step.title}</h3>
                    <p className="text-sm" style={{ color: "hsl(150,15%,55%)" }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
