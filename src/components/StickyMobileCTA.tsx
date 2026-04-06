import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const StickyMobileCTA = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // Show after scrolling past hero (~100vh)
      setShow(window.scrollY > window.innerHeight * 0.8);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ease-in-out ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ backgroundColor: "hsl(150,40%,5%)", borderTop: "1px solid hsl(150,30%,15%)" }}
    >
      <div className="px-4 py-3 flex gap-2">
        <Link to="/auth" className="flex-1">
          <Button size="sm" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl h-10 text-sm font-semibold">
            Registrar empresa
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
        <Link to="/auth">
          <Button size="sm" variant="outline" className="rounded-xl h-10 text-sm bg-transparent border-white/20 text-white hover:bg-white/5">
            Iniciar sesión
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default StickyMobileCTA;
