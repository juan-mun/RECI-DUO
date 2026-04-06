import { Scale, Users, Zap, Leaf, Clock } from "lucide-react";

const benefits = [
  { icon: Scale, title: "Cumplimiento legal garantizado", desc: "Opera con total tranquilidad sabiendo que cumples con toda la normativa ambiental vigente." },
  { icon: Users, title: "Red de empresas certificadas", desc: "Accede a un directorio verificado de gestores de residuos con todas sus credenciales al día." },
  { icon: Zap, title: "Optimización de procesos", desc: "Simplifica la gestión de residuos con herramientas digitales que ahorran pasos y papeleo." },
  { icon: Leaf, title: "Impacto ambiental positivo", desc: "Contribuye activamente a la economía circular y la protección del medio ambiente." },
  { icon: Clock, title: "Ahorro de tiempo y costos", desc: "Encuentra rápidamente al gestor adecuado sin intermediarios ni procesos engorrosos." },
];

const BenefitsSection = () => {
  return (
    <section id="beneficios" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Beneficios</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Todo lo que necesitas para una gestión de residuos eficiente y responsable.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-card rounded-2xl p-6 shadow-card hover:shadow-soft transition-shadow border border-border/50 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:eco-gradient-bg transition-colors">
                <b.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
