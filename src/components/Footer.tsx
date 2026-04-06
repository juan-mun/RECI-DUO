import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer style={{ backgroundColor: "hsl(150,40%,5%)" }} className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="rounded-lg p-1.5 bg-primary">
                <Leaf className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-headline text-lg text-white">RECI-DUO</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "hsl(150,15%,45%)" }}>
              Conectamos residuos con soluciones responsables.
            </p>
          </div>

          {/* Plataforma */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Plataforma</h4>
            <div className="space-y-2.5">
              <a href="#como-funciona" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Cómo funciona</a>
              <a href="#gestores" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Gestores</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Precios</a>
            </div>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Empresa</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Nosotros</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Blog</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Contacto</a>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <div className="space-y-2.5">
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Privacidad</a>
              <a href="#" className="block text-sm transition-colors hover:text-white" style={{ color: "hsl(150,15%,45%)" }}>Términos</a>
            </div>
          </div>
        </div>

        <div className="border-t pt-6" style={{ borderColor: "hsl(150,30%,15%)" }}>
          <p className="text-xs text-center" style={{ color: "hsl(150,15%,35%)" }}>
            © 2025 RECI-DUO · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
