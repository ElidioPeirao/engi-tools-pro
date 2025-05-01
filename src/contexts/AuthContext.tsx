
import React, { createContext, useState, useEffect, useContext } from "react";
import { User, AuthContextType } from "../types";
import { useToast } from "@/components/ui/use-toast";

// Usuário admin pré-definido
const adminUser: User = {
  id: "admin-1",
  username: "Elidio",
  email: "elidiopeiraojunior@gmail.com",
  password: "76255", // Em um ambiente real, isso seria armazenado de forma segura
  role: "admin",
  createdAt: new Date(),
  allowedTools: ["all"]
};

// Alguns usuários padrão para testes
const initialUsers: User[] = [
  adminUser,
  {
    id: "user-1",
    username: "usuario_padrao",
    email: "usuario@exemplo.com",
    password: "123456",
    role: "user",
    createdAt: new Date(),
    allowedTools: ["calc-eng", "calc-ele"]
  },
  {
    id: "user-2",
    username: "usuario_pro",
    email: "pro@exemplo.com",
    password: "123456",
    role: "pro",
    proExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    createdAt: new Date(),
    allowedTools: ["calc-eng", "calc-ele", "pro-tool-1", "pro-tool-2"]
  }
];

// Contexto de autenticação
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedUsers = localStorage.getItem("users");

    if (!storedUsers) {
      localStorage.setItem("users", JSON.stringify(initialUsers));
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

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

    setIsLoading(false);
  }, []);

  // Função de login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Busca usuários do localStorage
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      // Encontra o usuário
      const foundUser = users.find((u: User) => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error("Credenciais inválidas");
      }
      
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
      setUser(foundUser);
      
      toast({
        title: "Bem-vindo!",
        description: `Login realizado com sucesso. Bem-vindo, ${foundUser.username}!`,
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
      // Busca usuários do localStorage
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
  const logout = () => {
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
