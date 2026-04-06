import { ShieldCheck, FileSearch, CheckCircle2 } from "lucide-react";

const TrustSection = () => {
  return (
    <section id="confianza" className="py-20 md:py-28 bg-eco-light">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Empresas verificadas
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Todas las empresas pasan por un proceso de validación documental antes de ser aprobadas en la plataforma. Tu tranquilidad es nuestra prioridad.
            </p>
            <div className="space-y-4">
              {[
                { icon: FileSearch, text: "Revisión exhaustiva de certificaciones y licencias" },
                { icon: ShieldCheck, text: "Validación por expertos en normativa ambiental" },
                { icon: CheckCircle2, text: "Monitoreo continuo del estado de documentación" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div className="bg-card rounded-3xl p-8 shadow-card border border-border/50 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="eco-gradient-bg rounded-xl p-3">
                  <ShieldCheck className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-bold text-foreground text-lg">100%</div>
                  <div className="text-sm text-muted-foreground">Empresas verificadas</div>
                </div>
              </div>
              <div className="space-y-3">
                {["Certificados ambientales", "Licencias de operación", "Permisos vigentes", "Seguros de responsabilidad"].map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-primary/5 rounded-lg p-3">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{doc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
