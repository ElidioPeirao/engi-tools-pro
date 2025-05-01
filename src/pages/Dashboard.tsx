
import React from "react";
import { useNavigate } from "react-router-dom";
import { useTools } from "@/contexts/ToolsContext";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Calculator, Calculator2, Wrench, Settings } from "lucide-react";

const Dashboard = () => {
  const { getAccessibleTools } = useTools();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const accessibleTools = getAccessibleTools();
  
  // Separa ferramentas em padrão e pro
  const standardTools = accessibleTools.filter(tool => !tool.requiresPro);
  const proTools = accessibleTools.filter(tool => tool.requiresPro);
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "calculator":
        return <Calculator size={36} className="text-orange-400" />;
      case "calculator-2":
        return <Calculator2 size={36} className="text-orange-400" />;
      case "wrench":
        return <Wrench size={36} className="text-orange-400" />;
      case "settings":
        return <Settings size={36} className="text-orange-400" />;
      default:
        return <Wrench size={36} className="text-orange-400" />;
    }
  };

  return (
    <Layout>
      <div className="space-y-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            Bem-vindo ao 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              {" "}EngiTools Pro
            </span>
          </h1>
          <p className="mt-2 text-white/70">
            Selecione uma ferramenta para começar
          </p>
        </div>
        
        {/* Ferramentas Padrão */}
        <div>
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <span className="w-12 h-1 bg-gradient-to-r from-orange-500 to-transparent rounded-full mr-2"></span>
            Ferramentas Padrão
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {standardTools.map(tool => (
              <div 
                key={tool.id} 
                className="tool-card cursor-pointer"
                onClick={() => navigate(tool.url)}
              >
                <div className="mb-4">
                  {getIconComponent(tool.icon)}
                </div>
                <h3 className="text-lg font-medium mb-1">{tool.name}</h3>
                <p className="text-sm text-white/60">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Ferramentas Pro */}
        {user && user.role !== "user" && proTools.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-6 flex items-center">
              <span className="w-12 h-1 bg-gradient-to-r from-orange-300 to-transparent rounded-full mr-2"></span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500">
                Ferramentas Pro
              </span>
              <span className="ml-2 text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded-full">
                Premium
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {proTools.map(tool => (
                <div 
                  key={tool.id} 
                  className="tool-card cursor-pointer bg-gradient-to-br from-black to-orange-950/20"
                  onClick={() => navigate(tool.url)}
                >
                  <div className="mb-4">
                    {getIconComponent(tool.icon)}
                  </div>
                  <h3 className="text-lg font-medium mb-1">{tool.name}</h3>
                  <p className="text-sm text-white/60">{tool.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Mensagem para usuários padrão */}
        {user && user.role === "user" && (
          <div className="mt-12 bg-gradient-to-r from-orange-900/20 to-black p-6 rounded-xl border border-orange-900/30 text-center">
            <h3 className="text-lg font-medium text-orange-400 mb-2">
              Acesso Pro Disponível
            </h3>
            <p className="text-white/70 mb-4">
              Atualize para o plano Pro para acessar ferramentas avançadas e recursos exclusivos.
            </p>
            <p className="text-sm text-white/50">
              Entre em contato com um administrador para solicitar acesso Pro.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
