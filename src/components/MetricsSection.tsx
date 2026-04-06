import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { useEffect, useRef, useState } from "react";
import redImg from "@/assets/red.png";

function useCountUp(target: number, duration = 1800, trigger = false, decimals = 0) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!trigger || done.current) return;
    done.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = target * eased;
      setVal(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v));
      if (p < 1) requestAnimationFrame(step); else setVal(target);
    };
    requestAnimationFrame(step);
  }, [trigger, target, duration, decimals]);
  return val;
}

const metrics = [
  { target: 12847, label: "Manifiestos gestionados", sublabel: "en los últimos 30 días", suffix: "+", decimals: 0 },
  { target: 98.99, label: "Cumplimiento en la red", suffix: "%", decimals: 2 },
  { target: 24, label: "Tiempo promedio de conexión", prefix: "<", suffix: "h", decimals: 0 },
];

const MetricsSection = () => {
  const { ref, isVisible } = useScrollAnimation(0.15);
  const counts = [
    useCountUp(12847, 2000, isVisible),
    useCountUp(98.99, 2000, isVisible, 2),
    useCountUp(24, 1800, isVisible),
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-grid-pattern" style={{ backgroundColor: "#050f07" }}>
      {/* Background panoramic image */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src={redImg}
          alt="Red de gestores"
          className="w-full h-full object-cover"
          style={{
            mixBlendMode: "screen",
            opacity: 0.5,
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 30%, black 70%, transparent 100%)",
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10" ref={ref}>
        <div className="grid md:grid-cols-3 gap-6">
          {metrics.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl p-8 backdrop-blur-md text-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{
                backgroundColor: "rgba(11,26,15,0.85)",
                border: "0.5px solid rgba(29,158,117,0.2)",
                transitionDelay: isVisible ? `${i * 150}ms` : "0ms",
              }}
            >
              <p className="font-headline text-4xl md:text-5xl text-white font-light mb-2">
                {m.prefix || ""}{m.decimals > 0 ? counts[i].toFixed(m.decimals) : counts[i].toLocaleString()}{m.suffix || ""}
              </p>
              <p className="text-sm font-medium text-white mb-1">{m.label}</p>
              {m.sublabel && <p className="text-xs" style={{ color: "hsl(150,15%,45%)" }}>{m.sublabel}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MetricsSection;
