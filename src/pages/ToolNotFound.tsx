
import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

const ToolNotFound = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center py-20 space-y-6">
        <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center">
          <span className="text-3xl text-orange-400">!</span>
        </div>
        
        <h1 className="text-3xl font-bold">Ferramenta não encontrada</h1>
        
        <p className="text-white/70 text-center max-w-lg">
          A ferramenta que você está tentando acessar não existe ou você não tem permissão para acessá-la.
        </p>
        
        <Button
          onClick={() => navigate("/")}
          className="bg-orange-500 hover:bg-orange-600"
        >
          Voltar ao início
        </Button>
      </div>
    </Layout>
  );
};

export default ToolNotFound;
