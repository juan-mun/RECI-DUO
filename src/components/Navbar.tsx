import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b"
      style={{ backgroundColor: "rgba(244,247,240,0.92)", borderColor: "#e2edda" }}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5" style={{ backgroundColor: "#5a8a3c" }}>
            <Leaf className="h-5 w-5 text-white" />
          </div>
          <span className="font-headline text-lg font-bold" style={{ color: "#1c2b1a" }}>
            RECI-DUO
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: "#6b7f63" }}>
          <a href="#como-funciona" className="hover:opacity-70 transition-opacity">Cómo funciona</a>
          <a href="#beneficios" className="hover:opacity-70 transition-opacity">Beneficios</a>
          <a href="#confianza" className="hover:opacity-70 transition-opacity">Confianza</a>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm hover:opacity-70"
              style={{ color: "#6b7f63" }}
            >
              Iniciar sesión
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="sm"
              className="border-0 text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#5a8a3c", borderRadius: "9px" }}
            >
              Registrar empresa
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
