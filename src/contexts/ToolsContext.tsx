
import React, { createContext, useState, useEffect, useContext } from "react";
import { Tool } from "../types";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "./AuthContext";

// Ferramentas iniciais
const initialTools: Tool[] = [
  {
    id: "calc-eng",
    name: "Calculadora de Engenharia",
    description: "Calculadora avançada para cálculos de engenharia",
    url: "/tools/engineering-calculator",
    icon: "calculator",
    requiresPro: false,
    createdAt: new Date(),
    createdBy: "admin-1"
  },
  {
    id: "calc-ele",
    name: "Calculadora Elétrica",
    description: "Calculadora para projetos elétricos",
    url: "/tools/electrical-calculator",
    icon: "calculator-2",
    requiresPro: false,
    createdAt: new Date(),
    createdBy: "admin-1"
  },
  {
    id: "pro-tool-1",
    name: "Análise Estrutural",
    description: "Ferramenta avançada de análise estrutural",
    url: "/tools/structural-analysis",
    icon: "wrench",
    requiresPro: true,
    createdAt: new Date(),
    createdBy: "admin-1"
  },
  {
    id: "pro-tool-2",
    name: "Simulador Térmico",
    description: "Simulação de comportamento térmico",
    url: "/tools/thermal-simulator",
    icon: "settings",
    requiresPro: true,
    createdAt: new Date(),
    createdBy: "admin-1"
  }
];

type ToolsContextType = {
  tools: Tool[];
  addTool: (tool: Omit<Tool, "id" | "createdAt" | "createdBy">) => void;
  updateTool: (id: string, updates: Partial<Tool>) => void;
  deleteTool: (id: string) => void;
  getAccessibleTools: () => Tool[];
};

const ToolsContext = createContext<ToolsContextType>({} as ToolsContextType);

export const ToolsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Carregar ferramentas do localStorage ao iniciar
  useEffect(() => {
    const storedTools = localStorage.getItem("tools");
    if (!storedTools) {
      localStorage.setItem("tools", JSON.stringify(initialTools));
      setTools(initialTools);
    } else {
      setTools(JSON.parse(storedTools));
    }
  }, []);

  // Adicionar nova ferramenta
  const addTool = (tool: Omit<Tool, "id" | "createdAt" | "createdBy">) => {
    if (!user || user.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem adicionar ferramentas",
        variant: "destructive",
      });
      return;
    }

    const newTool: Tool = {
      ...tool,
      id: `tool-${Date.now()}`,
      createdAt: new Date(),
      createdBy: user.id
    };

    const updatedTools = [...tools, newTool];
    setTools(updatedTools);
    localStorage.setItem("tools", JSON.stringify(updatedTools));

    toast({
      title: "Ferramenta adicionada",
      description: `A ferramenta ${tool.name} foi adicionada com sucesso.`,
    });
  };

  // Atualizar ferramenta existente
  const updateTool = (id: string, updates: Partial<Tool>) => {
    if (!user || user.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem editar ferramentas",
        variant: "destructive",
      });
      return;
    }

    const updatedTools = tools.map(tool => 
      tool.id === id ? { ...tool, ...updates } : tool
    );

    setTools(updatedTools);
    localStorage.setItem("tools", JSON.stringify(updatedTools));

    toast({
      title: "Ferramenta atualizada",
      description: `A ferramenta foi atualizada com sucesso.`,
    });
  };

  // Deletar ferramenta
  const deleteTool = (id: string) => {
    if (!user || user.role !== "admin") {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem remover ferramentas",
        variant: "destructive",
      });
      return;
    }

    const filteredTools = tools.filter(tool => tool.id !== id);
    setTools(filteredTools);
    localStorage.setItem("tools", JSON.stringify(filteredTools));

    toast({
      title: "Ferramenta removida",
      description: `A ferramenta foi removida com sucesso.`,
    });
  };

  // Obter ferramentas acessíveis para o usuário atual
  const getAccessibleTools = () => {
    if (!user) {
      return [];
    }

    if (user.role === "admin") {
      return tools; // Admin tem acesso a todas as ferramentas
    }

    // Para usuário padrão ou pro, filtra com base em allowedTools
    return tools.filter(tool => {
      // Se a ferramenta requer Pro, verificamos o papel do usuário
      if (tool.requiresPro && user.role !== "pro") {
        return false;
      }
      
      // Verifica se a ferramenta está na lista de permitidas
      return user.allowedTools.includes(tool.id) || user.allowedTools.includes("all");
    });
  };

  return (
    <ToolsContext.Provider value={{ tools, addTool, updateTool, deleteTool, getAccessibleTools }}>
      {children}
    </ToolsContext.Provider>
  );
};

export const useTools = () => useContext(ToolsContext);
