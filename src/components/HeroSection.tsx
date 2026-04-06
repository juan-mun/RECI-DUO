import { Button } from "@/components/ui/button";
import { ArrowRight, Check, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";

function useCountUp(target: number, duration = 1800, isVisible = false) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);
  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4); // easeOutExpo-like
      setCount(target * eased);
      if (p < 1) requestAnimationFrame(step); else setCount(target);
    };
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);
  return count;
}

const HeroSection = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [parallaxY, setParallaxY] = useState(0);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Parallax on scroll (max 20px)
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
    <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "radial-gradient(ellipse at 30% 20%, hsl(150,40%,12%) 0%, hsl(150,40%,5%) 50%, hsl(150,50%,3%) 100%)" }}>
      {/* Decorative blurred orbs with parallax */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ transform: `translateY(${parallaxY * 0.5}px)` }}>
        <div className="absolute top-20 left-[10%] w-32 h-32 rounded-full opacity-[0.06]" style={{ background: "hsl(160,72%,37%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-32 right-[15%] w-48 h-48 rounded-full opacity-[0.07]" style={{ background: "hsl(160,55%,55%)", filter: "blur(60px)" }} />
        <div className="absolute top-1/3 right-[30%] w-24 h-24 rounded-full opacity-[0.04]" style={{ background: "hsl(160,72%,37%)", filter: "blur(30px)" }} />
        <div className="absolute top-[60%] left-[5%] w-40 h-40 rounded-full opacity-[0.03]" style={{ background: "hsl(160,55%,55%)", filter: "blur(50px)" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left — 60% text (parallax: headline moves slower) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Badge */}
            <div className="anim-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border w-fit"
              style={{ borderColor: "hsl(160,72%,37%,0.3)", backgroundColor: "hsl(160,72%,37%,0.08)" }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: "hsl(160,72%,37%)" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: "hsl(160,55%,55%)" }} />
              </span>
              <span className="text-sm font-medium" style={{ color: "hsl(160,55%,55%)" }}>Plataforma verificada · México</span>
            </div>

            {/* Headline with parallax offset */}
            <h1 className="font-headline text-hero leading-[1.05] tracking-tight" style={{ transform: `translateY(${-parallaxY * 0.3}px)` }}>
              <span className="block anim-h1-line1" style={{ color: "hsl(0,0%,95%)" }}>Tus residuos,</span>
              <span className="block anim-h1-line2 text-primary">gestionados legal</span>
              <span className="block anim-h1-line3" style={{ color: "hsl(0,0%,95%)" }}>y responsable</span>
            </h1>

            {/* Subheadline (slightly faster parallax = depth) */}
            <p className="text-lg max-w-[520px] leading-relaxed anim-sub" style={{ color: "hsl(150,15%,60%)", transform: `translateY(${-parallaxY * 0.15}px)` }}>
              Conecta tu empresa con gestores certificados. Cumplimiento normativo automático, sin intermediarios, sin papeleo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 anim-ctas">
              <Link to="/auth">
                <Button size="lg" className="bg-primary text-primary-foreground hover:scale-[1.02] hover:brightness-110 transition-all rounded-xl px-8 h-12 text-base font-semibold w-full sm:w-auto">
                  Soy generador de residuos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-12 text-base bg-transparent hover:bg-white/5 hover:scale-[1.02] transition-all w-full sm:w-auto"
                  style={{ borderColor: "hsl(0,0%,100%,0.2)", color: "hsl(0,0%,90%)" }}>
                  Soy gestor certificado
                </Button>
              </Link>
            </div>

            {/* Below CTA note */}
            <p className="text-sm anim-note" style={{ color: "hsl(150,15%,45%)" }}>
              Sin costo para empresas generadoras · Registro en 5 min
            </p>

            {/* Stats with count-up */}
            <div ref={statsRef} className="flex flex-wrap items-center gap-0 mt-2 anim-stats">
              <div className="pr-6 py-2">
                <p className="font-headline text-3xl md:text-4xl text-white">{Math.round(c0)}+</p>
                <p className="text-sm" style={{ color: "hsl(150,15%,50%)" }}>Empresas activas</p>
              </div>
              <div className="h-10 w-px" style={{ backgroundColor: "hsl(150,30%,20%)" }} />
              <div className="px-6 py-2">
                <p className="font-headline text-3xl md:text-4xl text-white">{c1.toFixed(1)}%</p>
                <p className="text-sm" style={{ color: "hsl(150,15%,50%)" }}>Cumplimiento legal</p>
              </div>
              <div className="h-10 w-px" style={{ backgroundColor: "hsl(150,30%,20%)" }} />
              <div className="px-6 py-2">
                <p className="font-headline text-3xl md:text-4xl text-white">&lt;{Math.round(c2)}h</p>
                <p className="text-sm" style={{ color: "hsl(150,15%,50%)" }}>Tiempo de conexión</p>
              </div>
              <div className="h-10 w-px hidden sm:block" style={{ backgroundColor: "hsl(150,30%,20%)" }} />
              <div className="pl-6 py-2 hidden sm:block">
                <p className="font-headline text-3xl md:text-4xl text-white">0</p>
                <p className="text-sm" style={{ color: "hsl(150,15%,50%)" }}>Multas en la plataforma</p>
              </div>
            </div>
          </div>

          {/* Right — 40% card stack */}
          <div className="lg:col-span-5 flex flex-col gap-4 anim-cards">
            {/* Trust checklist glassmorphism card */}
            <div className="rounded-2xl p-6 border backdrop-blur-md"
              style={{ backgroundColor: "hsl(150,30%,10%,0.7)", borderColor: "hsl(150,30%,20%)" }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: "hsl(160,55%,55%)" }}>
                Validación en tiempo real
              </p>
              <div className="space-y-3">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/20">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm" style={{ color: "hsl(150,15%,70%)" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency bar */}
            <div className="rounded-xl px-5 py-4 flex items-center gap-3 border"
              style={{ backgroundColor: "hsl(40,95%,72%,0.08)", borderColor: "hsl(40,95%,72%,0.2)" }}>
              <AlertTriangle className="h-5 w-5 flex-shrink-0" style={{ color: "hsl(40,95%,72%)" }} />
              <p className="text-sm font-medium" style={{ color: "hsl(40,95%,80%)" }}>
                El 68% de empresas tiene riesgo de multa por gestión irregular
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
