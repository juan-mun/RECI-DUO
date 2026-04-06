import { Building2, FileCheck, ShieldCheck, Handshake, Recycle } from "lucide-react";

const steps = [
  { icon: Building2, title: "Registra tu empresa", desc: "Crea tu perfil indicando si generas o gestionas residuos." },
  { icon: FileCheck, title: "Envía documentación", desc: "Sube tus certificaciones, licencias y permisos legales." },
  { icon: ShieldCheck, title: "Validamos tu certificación", desc: "Nuestro equipo revisa y aprueba tu documentación." },
  { icon: Handshake, title: "Conecta con empresas", desc: "Encuentra socios compatibles según tipo de residuo." },
  { icon: Recycle, title: "Gestiona eficientemente", desc: "Administra tus procesos de forma legal y responsable." },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Cómo funciona</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Un proceso simple y seguro para conectar empresas con gestores certificados.
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl eco-gradient-bg flex items-center justify-center mb-4 shadow-soft group-hover:scale-105 transition-transform">
                <step.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <div className="absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 bg-border hidden md:block last:hidden" style={i === steps.length - 1 ? { display: 'none' } : {}} />
              <span className="text-xs font-semibold text-primary mb-2">Paso {i + 1}</span>
              <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
