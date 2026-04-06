import { Button } from "@/components/ui/button";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero.png";

function useCountUp(target: number, duration = 1800, isVisible = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(target * eased);
      if (p < 1) requestAnimationFrame(step); else setCount(target);
    };
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);
  return count;
}

const rotatingWords = ["soluciones responsables", "soluciones sostenibles", "soluciones automatizadas", "soluciones certificadas"];

const HeroSection = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);
  const [rotatingWordIndex, setRotatingWordIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setRotatingWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setIsTransitioning(false);
      }, 400);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, -rect.top / rect.height));
    setParallaxY(progress * 20);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const c0 = useCountUp(500, 1800, statsVisible);
  const c1 = useCountUp(99.5, 1800, statsVisible);
  const c2 = useCountUp(24, 1800, statsVisible);

  const checklistItems = [
    "Certificados ambientales vigentes",
    "Licencias de operación actualizadas",
    "Permisos SEMARNAT verificados",
    "Seguros de responsabilidad civil",
  ];

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: "#0a1a0f" }}>
      {/* Decorative blurred orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transform: `translateY(${parallaxY * 0.5}px)` }}>
        <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full opacity-[0.06]" style={{ background: "hsl(160,72%,37%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-32 right-[15%] w-48 h-48 rounded-full opacity-[0.04]" style={{ background: "hsl(160,55%,55%)", filter: "blur(60px)" }} />
      </div>

      {/* Hero image — right side, mix-blend-mode screen */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%] hidden lg:block overflow-visible pointer-events-none">
        <img
          src={heroImg}
          alt="Ciudad isométrica de gestión de residuos"
          className="absolute top-1/2 -translate-y-1/2 right-0 w-full h-auto max-w-none object-contain"
          style={{
            mixBlendMode: "screen",
            WebkitMaskImage: "linear-gradient(to left, black 50%, transparent 95%)",
            maskImage: "linear-gradient(to left, black 50%, transparent 95%)",
            transform: `translateY(calc(-50% + ${parallaxY * 0.3}px))`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left — text */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Badge */}
            <div className="anim-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border w-fit"
              style={{ borderColor: "rgba(29,158,117,0.3)", backgroundColor: "#111f15" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "hsl(160,72%,37%)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "#5DCAA5" }} />
              </span>
              <span className="text-sm font-medium" style={{ color: "#5DCAA5" }}>Plataforma verificada · México</span>
            </div>

            <h1 className="font-headline text-hero leading-[1.05] tracking-tight" style={{ transform: `translateY(${-parallaxY * 0.3}px)` }}>
              <span className="block anim-h1-line1 text-white">Conectamos residuos</span>
              <span className="block anim-h1-line2 text-white">con{" "}
                <span className="inline-block overflow-hidden align-bottom" style={{ height: "1.1em" }}>
                  <span
                    className="inline-flex flex-col transition-transform duration-700 ease-in-out"
                    style={{
                      color: "#1D9E75",
                      transform: `translateY(-${rotatingWordIndex * 1.1}em)`,
                    }}
                  >
                    {rotatingWords.map((word, i) => (
                      <span key={i} className="block" style={{ height: "1.1em", lineHeight: "1.1em" }}>{word}</span>
                    ))}
                  </span>
                </span>
              </span>
            </h1>

            <p className="text-lg max-w-[440px] leading-relaxed anim-sub" style={{ color: "hsl(150,15%,60%)", transform: `translateY(${-parallaxY * 0.15}px)` }}>
              Conecta tu empresa con gestores certificados. Cumplimiento normativo automático, sin intermediarios, sin papeleo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 anim-ctas">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:scale-[1.02] hover:brightness-110 transition-all rounded-xl px-7 h-12 text-base font-semibold w-full sm:w-auto">
                  Soy generador de residuos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-xl px-7 h-12 text-base bg-transparent hover:bg-white/5 hover:scale-[1.02] transition-all w-full sm:w-auto"
                  style={{ borderColor: "rgba(240,244,241,0.25)", color: "#f0f4f1" }}>
                  Soy gestor certificado
                </Button>
              </Link>
            </div>

            <p className="text-[13px] anim-note" style={{ color: "hsl(150,15%,45%)" }}>
              Sin costo para empresas generadoras · Registro en 5 min
            </p>

            {/* Stats bar */}
            <div ref={statsRef} className="anim-stats rounded-xl px-5 py-4 mt-2 flex flex-wrap items-center gap-0"
              style={{ backgroundColor: "rgba(17,31,21,0.8)", border: "0.5px solid rgba(29,158,117,0.15)" }}>
              <div className="pr-6 py-1">
                <p className="font-headline text-2xl md:text-3xl text-white">{Math.round(c0)}+</p>
                <p className="text-xs" style={{ color: "hsl(150,15%,50%)" }}>Empresas activas</p>
              </div>
              <div className="h-8 w-px" style={{ backgroundColor: "rgba(29,158,117,0.2)" }} />
              <div className="px-6 py-1">
                <p className="font-headline text-2xl md:text-3xl text-white">{c1.toFixed(1)}%</p>
                <p className="text-xs" style={{ color: "hsl(150,15%,50%)" }}>Cumplimiento legal</p>
              </div>
              <div className="h-8 w-px" style={{ backgroundColor: "rgba(29,158,117,0.2)" }} />
              <div className="px-6 py-1">
                <p className="font-headline text-2xl md:text-3xl text-white">&lt;{Math.round(c2)}h</p>
                <p className="text-xs" style={{ color: "hsl(150,15%,50%)" }}>Tiempo de conexión</p>
              </div>
              <div className="h-8 w-px hidden sm:block" style={{ backgroundColor: "rgba(29,158,117,0.2)" }} />
              <div className="pl-6 py-1 hidden sm:block">
                <p className="font-headline text-2xl md:text-3xl text-white">0</p>
                <p className="text-xs" style={{ color: "hsl(150,15%,50%)" }}>Multas registradas</p>
              </div>
            </div>
          </div>

          {/* Right — cards (hidden on lg since image takes over) */}
          <div className="lg:col-span-5 flex flex-col gap-4 anim-cards lg:hidden">
            <div className="rounded-2xl p-6 border backdrop-blur-md"
              style={{ backgroundColor: "rgba(17,31,21,0.7)", borderColor: "rgba(29,158,117,0.2)" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "#5DCAA5" }}>
                Validación en tiempo real
              </p>
              <div className="space-y-3">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(29,158,117,0.2)" }}>
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm" style={{ color: "hsl(150,15%,70%)" }}>{item}</span>
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

export default HeroSection;
