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
    <section id="como-funciona" className="py-20 md:py-28" style={{ backgroundColor: "hsl(90, 30%, 95%)" }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: "hsl(105, 25%, 14%)" }}>Cómo funciona</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "hsl(105, 15%, 27%)" }}>
            Un proceso simple y seguro para conectar empresas con gestores certificados.
          </p>
        </div>
        <div className="grid md:grid-cols-5 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center group">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-soft group-hover:scale-105 transition-transform"
                style={{ backgroundColor: "hsl(105, 35%, 38%)" }}
              >
                <step.icon className="h-7 w-7" style={{ color: "hsl(0, 0%, 100%)" }} />
              </div>
              <div
                className="absolute top-8 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-0.5 hidden md:block"
                style={{ backgroundColor: "hsl(105, 25%, 80%)", ...(i === steps.length - 1 ? { display: 'none' } : {}) }}
              />
              <span className="text-xs font-semibold mb-2" style={{ color: "hsl(105, 35%, 38%)" }}>Paso {i + 1}</span>
              <h3 className="font-semibold mb-1" style={{ color: "hsl(105, 25%, 14%)" }}>{step.title}</h3>
              <p className="text-sm" style={{ color: "hsl(105, 12%, 45%)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
