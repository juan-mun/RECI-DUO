import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out anim-navbar"
      style={{
        backgroundColor: scrolled ? "#0a1a0f" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "0.5px solid rgba(29,158,117,0.15)" : "0.5px solid transparent",
      }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5 bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-headline text-lg text-white">RECI-DUO</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "hsl(150,15%,60%)" }}>
          <a href="#como-funciona" className="hover:text-white transition-colors duration-200">Cómo funciona</a>
          <a href="#beneficios" className="hover:text-white transition-colors duration-200">Beneficios</a>
          <a href="#gestores" className="hover:text-white transition-colors duration-200">Gestores</a>
          <a href="#confianza" className="hover:text-white transition-colors duration-200">Confianza</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="text-sm hover:bg-white/10 transition-colors" style={{ color: "hsl(150,15%,60%)" }}>
              Iniciar sesión
            </Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="bg-primary text-primary-foreground border-0 hover:bg-primary/90 hover:scale-[1.02] transition-all rounded-lg">
              Registrar empresa
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
