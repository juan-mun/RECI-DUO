import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import AdminLayout from "./pages/AdminLayout.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AdminSolicitudes from "./pages/AdminSolicitudes.tsx";
import AdminGeneradoras from "./pages/AdminGeneradoras.tsx";
import AdminRecolectoras from "./pages/AdminRecolectoras.tsx";
import AdminAlertas from "./pages/AdminAlertas.tsx";
import AdminReportes from "./pages/AdminReportes.tsx";
import AdminDatos from "./pages/AdminDatos.tsx";
import GeneradoraLayout from "./pages/GeneradoraLayout.tsx";
import GeneradoraDashboard from "./pages/GeneradoraDashboard.tsx";
import GeneradoraResiduos from "./pages/GeneradoraResiduos.tsx";
import GeneradoraSolicitudes from "./pages/GeneradoraSolicitudes.tsx";
import GeneradoraCertificados from "./pages/GeneradoraCertificados.tsx";
import Marketplace from "./pages/Marketplace.tsx";
import RecolectoraLayout from "./pages/RecolectoraLayout.tsx";
import RecolectoraDashboard from "./pages/RecolectoraDashboard.tsx";
import RecolectoraSolicitudes from "./pages/RecolectoraSolicitudes.tsx";
import RecolectoraRecolecciones from "./pages/RecolectoraRecolecciones.tsx";
import RecolectoraAgenda from "./pages/RecolectoraAgenda.tsx";
import RecolectoraCertificados from "./pages/RecolectoraCertificados.tsx";
import RecolectoraDocumentos from "./pages/RecolectoraDocumentos.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="solicitudes" element={<AdminSolicitudes />} />
              <Route path="alertas" element={<AdminAlertas />} />
              <Route path="generadoras" element={<AdminGeneradoras />} />
              <Route path="recolectoras" element={<AdminRecolectoras />} />
              <Route path="todas-solicitudes" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Todas las solicitudes</h1></div>} />
              <Route path="certificados" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Todos los certificados</h1></div>} />
              <Route path="recolecciones" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Todas las recolecciones</h1></div>} />
              <Route path="reportes" element={<AdminReportes />} />
              <Route path="datos" element={<AdminDatos />} />
              <Route path="configuracion" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Configuración</h1></div>} />
            </Route>
            <Route
              path="/generadora"
              element={
                <ProtectedRoute requiredRole="generadora">
                  <GeneradoraLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<GeneradoraDashboard />} />
              <Route path="residuos" element={<GeneradoraResiduos />} />
              <Route path="solicitudes" element={<GeneradoraSolicitudes />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="certificados" element={<GeneradoraCertificados />} />
              <Route path="reportes" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Reportes</h1><p className="text-muted-foreground mt-2">Próximamente podrás ver reportes de tu gestión.</p></div>} />
              <Route path="configuracion" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Configuración</h1><p className="text-muted-foreground mt-2">Configuración de tu empresa.</p></div>} />
            </Route>
            <Route
              path="/recolectora"
              element={
                <ProtectedRoute requiredRole="recolectora">
                  <RecolectoraLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RecolectoraDashboard />} />
              <Route path="solicitudes" element={<RecolectoraSolicitudes />} />
              <Route path="ofertas" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Mis Ofertas</h1><p className="text-muted-foreground mt-2">Historial de ofertas enviadas.</p></div>} />
              <Route path="recolecciones" element={<RecolectoraRecolecciones />} />
              <Route path="agenda" element={<RecolectoraAgenda />} />
              <Route path="certificados" element={<RecolectoraCertificados />} />
              <Route path="documentos" element={<RecolectoraDocumentos />} />
              <Route path="reportes" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Reportes</h1><p className="text-muted-foreground mt-2">Próximamente podrás ver reportes de tus recolecciones.</p></div>} />
              <Route path="configuracion" element={<div className="p-6"><h1 className="font-headline text-2xl font-bold">Configuración</h1><p className="text-muted-foreground mt-2">Configuración de tu empresa recolectora.</p></div>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
