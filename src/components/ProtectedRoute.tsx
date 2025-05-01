
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTools } from "@/contexts/ToolsContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requiresToolAccess?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresAuth = true,
  requiresAdmin = false,
  requiresToolAccess
}) => {
  const { user, isLoading } = useAuth();
  const { tools } = useTools();

  // Verifica se o usuário tem acesso à ferramenta específica
  const hasToolAccess = () => {
    if (!user || !requiresToolAccess) return true;
    
    // Admin tem acesso a tudo
    if (user.role === "admin") return true;
    
    // Verifica se o usuário tem a ferramenta na lista de permitidas
    if (user.allowedTools.includes("all") || user.allowedTools.includes(requiresToolAccess)) {
      // Se requer Pro, verifica se o usuário é Pro
      const tool = tools.find(t => t.id === requiresToolAccess);
      if (tool && tool.requiresPro && user.role !== "pro") {
        return false;
      }
      return true;
    }
    
    return false;
  };

  if (isLoading) {
    // Exibir tela de carregamento enquanto verifica autenticação
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-orange-400">Carregando...</div>
      </div>
    );
  }

  // Verifica se precisa estar autenticado
  if (requiresAuth && !user) {
    return <Navigate to="/login" />;
  }

  // Verifica se precisa ser admin
  if (requiresAdmin && (!user || user.role !== "admin")) {
    return <Navigate to="/" />;
  }

  // Verifica acesso à ferramenta
  if (requiresToolAccess && !hasToolAccess()) {
    return <Navigate to="/tool-not-found" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
