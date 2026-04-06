import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useRef, useState } from "react";
import verificacionImg from "@/assets/verificacion.png";

const checklist = [
  "Certificados ambientales",
  "Licencias de operación",
  "Permisos SEMARNAT vigentes",
  "Seguros de responsabilidad civil",
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
    <section id="confianza" className="relative py-20 md:py-28 overflow-hidden" style={{ backgroundColor: "#0a1a0f" }}>
      {/* Left image — verification facility */}
      <div className="absolute left-0 top-0 bottom-0 w-[45%] hidden lg:block pointer-events-none overflow-visible">
        <img
          src={verificacionImg}
          alt="Instalación certificada de reciclaje"
          className="absolute top-1/2 left-0 w-full h-auto max-w-none"
          style={{
            mixBlendMode: "screen",
            transform: "translateY(-50%)",
            WebkitMaskImage: "linear-gradient(to right, black 40%, transparent 90%)",
            maskImage: "linear-gradient(to right, black 40%, transparent 90%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className="lg:ml-auto lg:max-w-[50%]">
          <div className={`mb-10 transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: "#5DCAA5" }}>CONFIANZA</p>
            <h2 className="text-section font-headline text-white mb-4">Verificación que no es marketing.</h2>
            <p className="text-lg" style={{ color: "hsl(150,15%,55%)" }}>
              Cada gestor pasa por un proceso riguroso antes de ser aprobado.
            </p>
          </div>

          {/* Big stat */}
          <div className={`mb-8 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <p className="font-headline text-6xl md:text-7xl mb-1" style={{ color: "#5DCAA5" }}>{bigNum}%</p>
            <p className="text-lg font-medium text-white">empresas verificadas antes de operar</p>
          </div>

          {/* Checklist */}
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: isVisible ? `${500 + i * 150}ms` : "0ms" }}
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(29,158,117,0.2)" }}>
                  <Check className="h-3 w-3" style={{ color: "#1D9E75" }} />
                </div>
                <span className="text-sm" style={{ color: "hsl(150,15%,70%)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
