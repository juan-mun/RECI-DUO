import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/images/smart-city.jpeg";

const rotatingWords = ["sostenibles", "automatizadas", "certificadas", "responsables"];

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
      <div className="container mx-auto px-4 relative z-10 pt-28 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 animate-fade-up">
              <div className="w-8 h-[2px] rounded-full" style={{ backgroundColor: "#5a8a3c" }} />
              <p className="text-sm tracking-widest uppercase font-medium" style={{ color: "#6b7f63" }}>
                Plataforma de gestión de residuos
              </p>
            </div>

            <h1
              className="font-headline text-4xl md:text-5xl lg:text-[3.25rem] xl:text-[3.5rem] leading-[1.08] tracking-tight animate-fade-up-delay"
              style={{ color: "#1c2b1a", fontWeight: 900 }}
            >
              Reduce costos y cumple la normativa gestionando tus residuos{" "}
              <span
                className={`transition-opacity duration-400 inline-block ${fade ? "opacity-100" : "opacity-0"}`}
                style={{ color: "#5a8a3c" }}
              >
                {rotatingWords[wordIndex]}
              </span>
            </h1>

            <p
              className="text-base md:text-lg max-w-[480px] leading-relaxed animate-fade-up-delay-2"
              style={{ color: "#3d4f38" }}
            >
              Conecta con gestores certificados en menos de 24 horas y evita sanciones ambientales.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-up-delay-3">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="rounded-full px-8 hover:opacity-90 transition-opacity border-0 w-full sm:w-auto text-base"
                  style={{ backgroundColor: "#1c2b1a", color: "#ffffff" }}
                >
                  Gestionar mis residuos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 bg-transparent w-full sm:w-auto text-base"
                  style={{ borderColor: "#c8ddb8", borderWidth: "1.5px", color: "#3d4f38" }}
                >
                  Quiero recibir clientes
                </Button>
              </Link>
            </div>

            {/* Urgency bar */}
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 mt-2 animate-fade-up-delay-3"
              style={{ backgroundColor: "hsl(40, 90%, 96%)", border: "1px solid hsl(40, 70%, 85%)" }}
            >
              <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(40, 80%, 45%)" }} />
              <p className="text-sm font-medium" style={{ color: "hsl(40, 50%, 30%)" }}>
                Evita multas ambientales y optimiza tu operación desde hoy
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-0 mt-4 animate-fade-up-delay-3">
              <div className="pr-6">
                <p className="font-headline text-3xl md:text-4xl" style={{ color: "#1c2b1a", fontWeight: 800 }}>500+</p>
                <p className="text-sm" style={{ color: "#6b7f63" }}>empresas registradas</p>
              </div>
              <div className="h-10 w-[1.5px] rounded-full" style={{ backgroundColor: "#c8ddb8" }} />
              <div className="px-6">
                <p className="font-headline text-3xl md:text-4xl" style={{ color: "#1c2b1a", fontWeight: 800 }}>99.5%</p>
                <p className="text-sm" style={{ color: "#6b7f63" }}>cumplimiento legal</p>
              </div>
              <div className="h-10 w-[1.5px] rounded-full" style={{ backgroundColor: "#c8ddb8" }} />
              <div className="pl-6">
                <p className="font-headline text-3xl md:text-4xl" style={{ color: "#1c2b1a", fontWeight: 800 }}>&lt;24h</p>
                <p className="text-sm" style={{ color: "#6b7f63" }}>tiempo de conexión</p>
              </div>
            </div>
          </div>

          {/* Right — image */}
          <div className="relative flex items-center justify-center animate-slide-in-right">
            <img
              src={heroImage}
              alt="Ciudad inteligente y sostenible"
              className="w-full max-w-[540px] lg:max-w-none rounded-3xl"
              width={1024}
              height={576}
              style={{
                opacity: 0.9,
                filter: "drop-shadow(0 24px 48px rgba(60,100,40,0.13))",
              }}
            />
            {/* Badge */}
            <div
              className="absolute top-4 right-4 md:top-8 md:right-8 z-20 flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg"
              style={{ backgroundColor: "#5a8a3c" }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-200" />
              </span>
              <span className="text-white text-sm font-medium">99.5% cumplimiento</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
