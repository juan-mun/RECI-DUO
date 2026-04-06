import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: "#030a05", borderTop: "0.5px solid rgba(29,158,117,0.1)" }} className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg p-1.5 bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-headline text-lg text-white">RECI-DUO</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(150,15%,40%)" }}>
              Conectamos residuos con soluciones responsables.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Plataforma</h4>
            <div className="space-y-2.5">
              <a href="#como-funciona" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Cómo funciona</a>
              <a href="#gestores" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Gestores</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Precios</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Nosotros</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Blog</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Contacto</a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Privacidad</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,40%)" }}>Términos</a>
            </div>
          </div>
        </div>
        <div className="pt-6" style={{ borderTop: "0.5px solid rgba(29,158,117,0.1)" }}>
          <p className="text-xs text-center" style={{ color: "hsl(150,15%,30%)" }}>
            © 2025 RECI-DUO · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
