
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToolsProvider } from "@/contexts/ToolsContext";

// Pages
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AdminPage from "./pages/AdminPage";
import EngineeringCalculator from "./pages/EngineeringCalculator";
import ElectricalCalculator from "./pages/ElectricalCalculator";
import ToolNotFound from "./pages/ToolNotFound";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ToolsProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Rota pública */}
              <Route path="/login" element={<LoginPage />} />

              {/* Rotas protegidas */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />

              {/* Rota de admin */}
              <Route path="/admin" element={
                <ProtectedRoute requiresAdmin>
                  <AdminPage />
                </ProtectedRoute>
              } />

              {/* Ferramentas */}
              <Route path="/tools/engineering-calculator" element={
                <ProtectedRoute requiresToolAccess="calc-eng">
                  <EngineeringCalculator />
                </ProtectedRoute>
              } />
              
              <Route path="/tools/electrical-calculator" element={
                <ProtectedRoute requiresToolAccess="calc-ele">
                  <ElectricalCalculator />
                </ProtectedRoute>
              } />
              
              {/* Página para ferramenta não encontrada ou sem acesso */}
              <Route path="/tool-not-found" element={
                <ProtectedRoute>
                  <ToolNotFound />
                </ProtectedRoute>
              } />

              {/* Redireciona raiz para dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              
              {/* Rota não encontrada */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ToolsProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
