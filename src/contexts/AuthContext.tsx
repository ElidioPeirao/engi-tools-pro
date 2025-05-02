
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
        
        // Verificar sessão no Supabase
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Se tiver sessão no Supabase, busca os dados adicionais do usuário
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (userError) {
              console.error("Erro ao buscar dados de usuário:", userError);
              // Tenta usar os dados do localStorage como fallback
              const storedUser = localStorage.getItem("user");
              if (storedUser) {
                setUser(JSON.parse(storedUser));
              }
            } else if (userData) {
              // Converte as datas de string para objetos Date
              const user: User = {
                ...userData,
                createdAt: new Date(userData.createdAt),
                proExpiresAt: userData.proExpiresAt ? new Date(userData.proExpiresAt) : null
              };
              setUser(user);
              localStorage.setItem("user", JSON.stringify(user));
            }
          } catch (error) {
            console.error("Erro ao processar dados de usuário:", error);
            // Fallback para dados locais
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        } else {
          // Se não tiver sessão no Supabase, tenta usar os dados do localStorage
          const storedUser = localStorage.getItem("user");
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          } else {
            setUser(null);
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
          try {
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (userError) {
              console.error("Erro ao buscar dados de usuário:", userError);
            } else if (userData) {
              // Converte as datas de string para objetos Date
              const user: User = {
                ...userData,
                createdAt: new Date(userData.createdAt),
                proExpiresAt: userData.proExpiresAt ? new Date(userData.proExpiresAt) : null
              };
              setUser(user);
              localStorage.setItem("user", JSON.stringify(user));
            }
          } catch (error) {
            console.error("Erro ao buscar dados de usuário:", error);
          }
        } else if (event === 'SIGNED_OUT') {
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
        
        // Atualiza os dados no Supabase
        supabase
          .from('users')
          .update({
            role: 'user',
            allowedTools: updatedUser.allowedTools
          })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) {
              console.error("Erro ao atualizar status de usuário:", error);
            }
          });
        
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

  // Função de login que usa o Supabase
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Login no Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw new Error(error.message);
      
      // Busca dados completos do usuário
      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (userError) {
          console.error("Erro ao buscar dados do usuário:", userError);
        } else if (userData) {
          // Converte as datas de string para objetos Date
          const user: User = {
            ...userData,
            createdAt: new Date(userData.createdAt),
            proExpiresAt: userData.proExpiresAt ? new Date(userData.proExpiresAt) : null
          };
          
          // Verificamos se é um usuário Pro com acesso expirado
          if (user.role === "pro" && user.proExpiresAt) {
            const expiryDate = new Date(user.proExpiresAt);
            if (expiryDate < new Date()) {
              user.role = "user";
              user.allowedTools = user.allowedTools.filter(tool => !tool.startsWith("pro-"));
              
              // Atualiza no Supabase
              await supabase
                .from('users')
                .update({
                  role: 'user',
                  allowedTools: user.allowedTools
                })
                .eq('id', user.id);
              
              toast({
                title: "Acesso Pro expirado",
                description: "Seu acesso Pro expirou. Algumas ferramentas foram desativadas.",
                variant: "destructive",
              });
            }
          }
          
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
        }
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
      const { data, error } = await supabase.auth.signUp({
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
      
      if (data.user) {
        // Cria novo usuário na tabela users
        const newUser: User = {
          id: data.user.id,
          username,
          email,
          password, // Em um ambiente real, não armazenaríamos a senha assim
          role: "user",
          createdAt: new Date(),
          allowedTools: ["calc-eng", "calc-ele"] // Ferramentas padrão
        };
        
        // Insere os dados na tabela users
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
            createdAt: newUser.createdAt.toISOString(),
            allowedTools: newUser.allowedTools
          }]);
        
        if (insertError) {
          console.error("Erro ao inserir usuário na tabela:", insertError);
          throw new Error("Erro ao inserir usuário na tabela");
        }
        
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
      }
      
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

  // Função para resgatar código de bônus
  const redeemCode = async (code: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro ao resgatar código",
        description: "Você precisa estar logado para resgatar um código.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // Busca o código no banco de dados
      const { data: bonusCodeData, error: bonusCodeError } = await supabase
        .from('bonus_codes')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (bonusCodeError || !bonusCodeData) {
        toast({
          title: "Código inválido",
          description: "O código informado não existe ou não está ativo.",
          variant: "destructive",
        });
        return false;
      }

      // Verifica se o código está expirado
      if (bonusCodeData.expires_at && new Date(bonusCodeData.expires_at) < new Date()) {
        toast({
          title: "Código expirado",
          description: "Este código já expirou.",
          variant: "destructive",
        });
        return false;
      }

      // Verifica se o código já atingiu o limite de usos
      if (bonusCodeData.current_uses >= bonusCodeData.max_uses) {
        toast({
          title: "Código indisponível",
          description: "Este código já atingiu o limite máximo de usos.",
          variant: "destructive",
        });
        return false;
      }

      // Verifica se o usuário já resgatou este código
      const { data: existingRedemption, error: existingRedemptionError } = await supabase
        .from('code_redemptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('code_id', bonusCodeData.id)
        .single();

      if (!existingRedemptionError && existingRedemption) {
        toast({
          title: "Código já resgatado",
          description: "Você já utilizou este código anteriormente.",
          variant: "destructive",
        });
        return false;
      }

      // Calcula a data de expiração do acesso Pro
      const proExpirationDate = new Date();
      proExpirationDate.setDate(proExpirationDate.getDate() + bonusCodeData.duration_days);

      // Registra o resgate do código
      const { error: redemptionError } = await supabase
        .from('code_redemptions')
        .insert([{
          code_id: bonusCodeData.id,
          user_id: user.id,
          redeemed_at: new Date().toISOString(),
          pro_expires_at: proExpirationDate.toISOString()
        }]);

      if (redemptionError) {
        console.error("Erro ao registrar resgate:", redemptionError);
        toast({
          title: "Erro ao resgatar código",
          description: "Ocorreu um erro ao registrar o resgate do código.",
          variant: "destructive",
        });
        return false;
      }

      // Incrementa o contador de usos do código
      const { error: updateCodeError } = await supabase
        .from('bonus_codes')
        .update({
          current_uses: bonusCodeData.current_uses + 1
        })
        .eq('id', bonusCodeData.id);

      if (updateCodeError) {
        console.error("Erro ao atualizar código:", updateCodeError);
      }

      // Atualiza o usuário para Pro
      const updatedUser = {
        ...user,
        role: "pro" as const,
        proExpiresAt: proExpirationDate
      };

      // Atualiza no Supabase
      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          role: 'pro',
          proExpiresAt: proExpirationDate.toISOString()
        })
        .eq('id', user.id);

      if (updateUserError) {
        console.error("Erro ao atualizar usuário:", updateUserError);
        toast({
          title: "Erro ao atualizar perfil",
          description: "O código foi resgatado, mas houve um erro ao atualizar seu perfil.",
          variant: "warning",
        });
      } else {
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      toast({
        title: "Código resgatado com sucesso!",
        description: `Você agora tem acesso Pro até ${proExpirationDate.toLocaleDateString()}`,
      });

      return true;
    } catch (error) {
      console.error("Erro ao resgatar código:", error);
      toast({
        title: "Erro ao resgatar código",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, redeemCode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
