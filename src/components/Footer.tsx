import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="eco-gradient-bg rounded-lg p-1.5">
              <Leaf className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-background">RECI-DUO</span>
          </div>
          <div className="flex gap-6 text-sm text-background/60">
            <a href="#" className="hover:text-background transition-colors">Términos</a>
            <a href="#" className="hover:text-background transition-colors">Privacidad</a>
            <a href="#" className="hover:text-background transition-colors">Contacto</a>
          </div>
          <p className="text-xs text-background/40">
            © 2026 RECI-DUO. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
