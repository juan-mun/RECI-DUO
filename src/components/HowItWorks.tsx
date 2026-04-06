import { Upload, MessageSquare, CalendarCheck, Award } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import howItWorksImage from "@/assets/images/characters-exchange.jpeg";

const steps = [
  { icon: Upload, title: "Publica tu residuo", desc: "Registra el tipo, cantidad y ubicación de tu residuo en minutos." },
  { icon: MessageSquare, title: "Recibe ofertas", desc: "Gestores certificados te envían propuestas competitivas." },
  { icon: CalendarCheck, title: "Agenda recolección", desc: "Elige la mejor oferta y programa la fecha de recolección." },
  { icon: Award, title: "Obtén certificados", desc: "Recibe tu certificado de disposición legal automáticamente." },
];

const HowItWorks = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="como-funciona" className="py-24 md:py-32" style={{ backgroundColor: "#f4f7f0" }}>
      <div className="container mx-auto px-4">
        <div
          ref={ref}
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="text-center mb-16">
            <p className="text-sm tracking-widest uppercase font-medium mb-3" style={{ color: "#5a8a3c" }}>
              Proceso simple
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-headline" style={{ color: "#1c2b1a" }}>
              Cómo funciona
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: "#3d4f38" }}>
              En 4 pasos conectas tus residuos con gestores certificados.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Steps */}
            <div className="grid sm:grid-cols-2 gap-5">
              {steps.map((step, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-border/40 group hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                  style={{
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: "hsl(105, 35%, 38% / 0.1)" }}
                  >
                    <step.icon className="h-6 w-6" style={{ color: "#5a8a3c" }} />
                  </div>
                  <span className="text-xs font-semibold mb-1 block" style={{ color: "#5a8a3c" }}>
                    Paso {i + 1}
                  </span>
                  <h3 className="font-semibold mb-1" style={{ color: "#1c2b1a" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6b7f63" }}>{step.desc}</p>
                </div>
              ))}
            </div>

            {/* Image */}
            <div className="flex justify-center">
              <img
                src={howItWorksImage}
                alt="Intercambio de materiales reciclables"
                className="w-full max-w-md rounded-2xl"
                loading="lazy"
                style={{
                  opacity: 0.8,
                  filter: "drop-shadow(0 16px 32px rgba(60,100,40,0.1))",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
