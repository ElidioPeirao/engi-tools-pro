
import React, { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "../types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Contexto de autenticação
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Carregar usuário do localStorage ao iniciar e configurar listener para mudanças na autenticação
  useEffect(() => {
    // Verificar sessão atual
    const loadUser = async () => {
      try {
        setIsLoading(true);
        
        // Primeiro verifica se há um usuário no localStorage (para compatibilidade com o sistema anterior)
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        
        // Verifica também se há sessão no Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Se tiver sessão no Supabase, busca os dados adicionais do usuário
          try {
            // Busca usuários do localStorage para compatibilidade
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const localUser = users.find((u: User) => u.email === session.user.email);
            
            if (localUser) {
              // Combina os dados
              const updatedUser = {
                ...localUser,
                id: session.user.id,
              };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error("Erro ao buscar dados de usuário:", error);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Configura listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          // Quando um usuário faz login, buscamos seus dados adicionais
          try {
            // Busca usuários do localStorage para compatibilidade
            const users = JSON.parse(localStorage.getItem("users") || "[]");
            const localUser = users.find((u: User) => u.email === session.user.email);
            
            if (localUser) {
              // Combina os dados
              const updatedUser = {
                ...localUser,
                id: session.user.id,
              };
              setUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          } catch (error) {
            console.error("Erro ao buscar dados de usuário:", error);
          }
        } else if (event === 'SIGNED_OUT') {
          // Quando o usuário sai, removemos seus dados
          setUser(null);
          localStorage.removeItem("user");
        }
      }
    );

    loadUser();

    // Verificamos se a sessão pro expirou
    if (user && user.role === "pro" && user.proExpiresAt) {
      const expiryDate = new Date(user.proExpiresAt);
      if (expiryDate < new Date()) {
        // Rebaixa usuário para padrão
        const updatedUser = {
          ...user,
          role: "user" as const,
          allowedTools: user.allowedTools.filter(tool => !tool.startsWith("pro-"))
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Atualiza na lista de usuários
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const updatedUsers = users.map((u: User) => 
          u.id === user.id ? updatedUser : u
        );
        localStorage.setItem("users", JSON.stringify(updatedUsers));
        
        toast({
          title: "Acesso Pro expirado",
          description: "Seu acesso Pro expirou. Algumas ferramentas foram desativadas.",
          variant: "destructive",
        });
      }
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função de login que usa tanto Supabase quanto localStorage
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Tenta fazer login no Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw new Error(error.message);
      
      // Para compatibilidade, também busca usuário do localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const foundUser = users.find((u: User) => u.email === email && u.password === password);
      
      if (foundUser) {
        // Verificamos se é um usuário Pro com acesso expirado
        if (foundUser.role === "pro" && foundUser.proExpiresAt) {
          const expiryDate = new Date(foundUser.proExpiresAt);
          if (expiryDate < new Date()) {
            foundUser.role = "user";
            foundUser.allowedTools = foundUser.allowedTools.filter(tool => !tool.startsWith("pro-"));
            
            // Atualiza na lista de usuários
            const updatedUsers = users.map((u: User) => 
              u.id === foundUser.id ? foundUser : u
            );
            localStorage.setItem("users", JSON.stringify(updatedUsers));
            
            toast({
              title: "Acesso Pro expirado",
              description: "Seu acesso Pro expirou. Algumas ferramentas foram desativadas.",
              variant: "destructive",
            });
          }
        }
        
        // Guarda o usuário na sessão
        localStorage.setItem("user", JSON.stringify(foundUser));
      }
      
      toast({
        title: "Bem-vindo!",
        description: `Login realizado com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      // Registra o usuário no Supabase
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role: "user",
          }
        }
      });
      
      if (error) throw new Error(error.message);
      
      // Para compatibilidade, também salva no localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Verifica se o email já está em uso
      const existingUser = users.find((u: User) => u.email === email);
      
      if (existingUser) {
        throw new Error("Email já está em uso");
      }
      
      // Cria novo usuário
      const newUser: User = {
        id: `user-${Date.now()}`,
        username,
        email,
        password,
        role: "user",
        createdAt: new Date(),
        allowedTools: ["calc-eng", "calc-ele"] // Ferramentas padrão
      };
      
      // Adiciona à lista de usuários
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      
      // Faz login com o novo usuário
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      
      toast({
        title: "Conta criada com sucesso",
        description: `Bem-vindo, ${username}!`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    // Sai do Supabase
    await supabase.auth.signOut();
    
    // Limpa localStorage
    localStorage.removeItem("user");
    setUser(null);
    
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
