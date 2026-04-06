import { Quote } from "lucide-react";

const UseCaseSection = () => {
  return (
    <section className="py-20 md:py-28 bg-eco-light">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-card rounded-3xl p-8 md:p-12 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="eco-gradient-bg rounded-full p-2">
                <Quote className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Ejemplo real</span>
            </div>
            <p className="text-lg md:text-xl text-foreground leading-relaxed mb-6">
              Un taller automotriz necesita desechar aceite usado. A través de la plataforma encuentra una empresa certificada que recoge y trata este residuo de forma ambientalmente responsable.
            </p>
            <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-4 border border-primary/10">
              <div className="h-2 w-2 rounded-full eco-gradient-bg flex-shrink-0" />
              <p className="text-sm font-medium text-primary">
                Ahorra tiempo, cumple la ley y protege el medio ambiente
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCaseSection;
