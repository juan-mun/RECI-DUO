import { AlertTriangle } from "lucide-react";

const UrgencyBanner = () => {
  return (
    <div
      className="py-4 px-4 md:px-12"
      style={{
        backgroundColor: "rgba(250,199,117,0.05)",
        borderTop: "0.5px solid rgba(250,199,117,0.2)",
        borderBottom: "0.5px solid rgba(250,199,117,0.2)",
      }}
    >
      <div className="container mx-auto flex items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" style={{ color: "#FAC775" }} />
        <p className="text-sm font-medium" style={{ color: "#FAC775" }}>
          El 68% de empresas en México tiene riesgo de multa por gestión irregular de residuos.
        </p>
        <a href="#como-funciona" className="text-sm font-semibold whitespace-nowrap hover:underline" style={{ color: "#5DCAA5" }}>
          Verificar ahora →
        </a>
      </div>
    </div>
  );
};

export default UrgencyBanner;
