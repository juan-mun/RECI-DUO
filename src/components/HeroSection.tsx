import { Button } from "@/components/ui/button";
import { ArrowRight, Recycle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.png";

const rotatingWords = ["sostenibles", "automatizadas", "certificadas", "responsables"];

/* Decorative leaf SVG paths */
const Leaf1 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M60 10C60 10 20 40 20 70C20 90 38 110 60 110C82 110 100 90 100 70C100 40 60 10 60 10Z" fill="currentColor" />
    <path d="M60 30V100M60 50C48 45 35 55 35 55M60 70C72 65 85 75 85 75" stroke="white" strokeWidth="2" opacity="0.3" />
  </svg>
);

const Leaf2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 55C5 55 25 5 50 5C75 5 95 55 95 55C95 55 75 35 50 35C25 35 5 55 5 55Z" fill="currentColor" />
    <path d="M10 50C10 50 30 15 50 15C70 15 90 50 90 50" stroke="white" strokeWidth="1.5" opacity="0.3" />
  </svg>
);

const Leaf3 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 140" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 5C40 5 5 35 5 75C5 105 20 135 40 135C60 135 75 105 75 75C75 35 40 5 40 5Z" fill="currentColor" />
    <path d="M40 25V125M40 50C30 48 18 55 18 55M40 80C50 78 62 85 62 85" stroke="white" strokeWidth="1.5" opacity="0.25" />
  </svg>
);

const HeroSection = () => {
  const [wordIndex, setWordIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % rotatingWords.length);
        setFade(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={{ backgroundColor: "#f4f7f0" }}>
      {/* Decorative leaves */}
      <Leaf1 className="absolute top-16 left-6 w-16 h-16 text-[#5a8a3c] opacity-[0.12] animate-float-leaf rotate-[-20deg]" />
      <Leaf2 className="absolute top-32 right-12 w-24 h-14 text-[#5a8a3c] opacity-[0.10] animate-float-leaf-slow rotate-[15deg]" />
      <Leaf3 className="absolute bottom-20 left-10 w-12 h-20 text-[#5a8a3c] opacity-[0.15] animate-float-leaf-slow rotate-[10deg]" />
      <Leaf1 className="absolute bottom-32 right-6 w-20 h-20 text-[#5a8a3c] opacity-[0.08] animate-float-leaf rotate-[30deg]" />
      <Leaf2 className="absolute top-1/2 left-[2%] w-14 h-8 text-[#5a8a3c] opacity-[0.10] animate-float-leaf rotate-[-10deg]" />
      <Leaf3 className="absolute top-24 left-[40%] w-10 h-16 text-[#5a8a3c] opacity-[0.07] animate-float-leaf-slow rotate-[25deg]" />

      <div className="container mx-auto px-4 relative z-10 pt-24 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left column — text content (45%) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Subtitle line */}
            <div className="flex items-center gap-3 animate-fade-up">
              <div className="w-8 h-[2px] rounded-full" style={{ backgroundColor: "#5a8a3c" }} />
              <p className="text-sm tracking-widest uppercase font-medium" style={{ color: "#6b7f63" }}>
                Gestión inteligente de residuos
              </p>
            </div>

            {/* Main headline */}
            <h1
              className="font-headline text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl leading-[1.08] tracking-tight animate-fade-up-delay"
              style={{ color: "#1c2b1a", fontWeight: 900 }}
            >
              Conectamos residuos con{" "}
              <span
                className={`transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
                style={{ color: "#5a8a3c" }}
              >
                soluciones {rotatingWords[wordIndex]}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="text-base max-w-[420px] leading-relaxed animate-fade-up-delay-2"
              style={{ color: "#3d4f38" }}
            >
              Plataforma digital que conecta empresas generadoras de residuos con gestores certificados. Cumplimiento legal automático.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up-delay-3">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="rounded-full px-8 hover:opacity-90 transition-opacity border-0 w-full sm:w-auto"
                  style={{ backgroundColor: "#1c2b1a", color: "#ffffff" }}
                >
                  Soy generador
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 bg-transparent w-full sm:w-auto"
                  style={{ borderColor: "#c8ddb8", borderWidth: "1.5px", color: "#3d4f38" }}
                >
                  Soy gestor de residuos
                </Button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-0 mt-4 animate-fade-up-delay-3">
              <div className="pr-6">
                <p className="font-headline text-3xl md:text-4xl" style={{ color: "#1c2b1a", fontWeight: 800 }}>
                  500+
                </p>
                <p className="text-sm" style={{ color: "#6b7f63" }}>empresas registradas</p>
              </div>
              <div className="h-10 w-[1.5px] rounded-full" style={{ backgroundColor: "#c8ddb8" }} />
              <div className="px-6">
                <p className="font-headline text-3xl md:text-4xl" style={{ color: "#1c2b1a", fontWeight: 800 }}>
                  99.5%
                </p>
                <p className="text-sm" style={{ color: "#6b7f63" }}>cumplimiento legal</p>
              </div>
              <div className="h-10 w-[1.5px] rounded-full" style={{ backgroundColor: "#c8ddb8" }} />
              <div className="pl-6">
                <p className="font-headline text-3xl md:text-4xl" style={{ color: "#1c2b1a", fontWeight: 800 }}>
                  &lt;24h
                </p>
                <p className="text-sm" style={{ color: "#6b7f63" }}>tiempo de conexión</p>
              </div>
            </div>
          </div>

          {/* Right column — illustration (55%) */}
          <div className="lg:col-span-7 relative flex items-center justify-center animate-slide-in-right">
            {/* Badge 2 — top right */}
            <div
              className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg"
              style={{ backgroundColor: "#5a8a3c" }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-200" />
              </span>
              <span className="text-white text-sm font-medium">99.5% cumplimiento legal</span>
            </div>

            {/* 3D Illustration */}
            <img
              src={heroIllustration}
              alt="Ilustración isométrica de gestión de residuos"
              className="w-full max-w-[560px] lg:max-w-none"
              width={1024}
              height={1024}
              style={{ filter: "drop-shadow(0 24px 48px rgba(60,100,40,0.13))" }}
            />

            {/* Badge 1 — bottom left */}
            <div
              className="absolute bottom-8 left-0 md:bottom-12 md:left-4 z-20 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg border"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2edda" }}
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg" style={{ backgroundColor: "#eef5e8" }}>
                <Recycle className="h-5 w-5" style={{ color: "#5a8a3c" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#1c2b1a" }}>Red activa</p>
                <p className="text-xs" style={{ color: "#6b7f63" }}>Empresas certificadas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
