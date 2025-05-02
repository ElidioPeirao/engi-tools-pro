
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTools } from "@/contexts/ToolsContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Calculator, Wrench as WrenchIcon, Settings as SettingsIcon, Gift as GiftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const { getAccessibleTools } = useTools();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [bonusCode, setBonusCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  
  const accessibleTools = getAccessibleTools();
  
  // Separa ferramentas em padrão e pro
  const standardTools = accessibleTools.filter(tool => !tool.requiresPro);
  const proTools = accessibleTools.filter(tool => tool.requiresPro);
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "calculator":
        return <Calculator size={36} className="text-orange-400" />;
      case "calculator-2":
        return <Calculator size={36} className="text-orange-400" />; // Using Calculator for both cases
      case "wrench":
        return <WrenchIcon size={36} className="text-orange-400" />;
      case "settings":
        return <SettingsIcon size={36} className="text-orange-400" />;
      default:
        return <WrenchIcon size={36} className="text-orange-400" />;
    }
  };

  // Função para resgatar código bônus
  const handleRedeemCode = async () => {
    if (!bonusCode.trim()) {
      toast({
        title: "Código inválido",
        description: "Por favor, digite um código válido",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Não autenticado",
        description: "Você precisa estar logado para resgatar um código",
        variant: "destructive",
      });
      return;
    }
    
    setIsRedeeming(true);
    
    try {
      // 1. Busca o código no banco de dados
      const { data: codeData, error: codeError } = await supabase
        .from('bonus_codes')
        .select('*')
        .eq('code', bonusCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();
      
      if (codeError || !codeData) {
        throw new Error("Código inválido ou expirado");
      }
      
      // 2. Verifica restrições do código
      if (codeData.current_uses >= codeData.max_uses) {
        throw new Error("Este código já atingiu o número máximo de usos");
      }
      
      if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
        throw new Error("Este código está expirado");
      }
      
      // 3. Verifica se o usuário já resgatou este código
      const { data: existingRedemption, error: redemptionError } = await supabase
        .from('code_redemptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('code_id', codeData.id)
        .maybeSingle();
      
      if (existingRedemption) {
        throw new Error("Você já resgatou este código");
      }
      
      // 4. Calcula a nova data de expiração Pro
      const currentExpiry = user.proExpiresAt ? new Date(user.proExpiresAt) : new Date();
      const now = new Date();
      
      // Se a assinatura já expirou, começa a contar a partir de agora
      const startDate = currentExpiry > now ? currentExpiry : now;
      const newExpiryDate = new Date(startDate);
      newExpiryDate.setDate(newExpiryDate.getDate() + codeData.duration_days);
      
      // 5. Registra o resgate
      const { error: insertError } = await supabase
        .from('code_redemptions')
        .insert({
          user_id: user.id,
          code_id: codeData.id,
          pro_expires_at: newExpiryDate.toISOString()
        });
      
      if (insertError) throw insertError;
      
      // 6. Incrementa o contador de usos do código
      const { error: updateError } = await supabase
        .from('bonus_codes')
        .update({ current_uses: codeData.current_uses + 1 })
        .eq('id', codeData.id);
      
      if (updateError) throw updateError;
      
      // 7. Atualiza o usuário local
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.map((u: any) => {
        if (u.id === user.id) {
          return {
            ...u,
            role: "pro",
            proExpiresAt: newExpiryDate
          };
        }
        return u;
      });
      
      localStorage.setItem("users", JSON.stringify(updatedUsers));
      localStorage.setItem("user", JSON.stringify({
        ...user,
        role: "pro",
        proExpiresAt: newExpiryDate
      }));
      
      // 8. Força um reload da página para atualizar o estado
      toast({
        title: "Código resgatado com sucesso!",
        description: `Você agora tem acesso Pro até ${newExpiryDate.toLocaleDateString('pt-BR')}`,
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error("Erro ao resgatar código:", error);
      toast({
        title: "Erro ao resgatar código",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsRedeeming(false);
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
        
        {/* Seção de Resgate de Código */}
        {user && user.role === "user" && (
          <Card className="glass-card bg-gradient-to-r from-orange-900/30 to-black border-orange-900/30">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="bg-orange-500/20 p-3 rounded-full">
                <GiftIcon size={28} className="text-orange-400" />
              </div>
              <div>
                <CardTitle>Resgatar Código Bônus</CardTitle>
                <CardDescription>Insira seu código promocional para acessar recursos Pro</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="bonus-code">Código Promocional</Label>
                  <Input
                    id="bonus-code"
                    value={bonusCode}
                    onChange={(e) => setBonusCode(e.target.value.toUpperCase())}
                    placeholder="Insira o código"
                    className="mt-1 bg-black/30 border-orange-900/30 uppercase"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto" 
                    onClick={handleRedeemCode}
                    disabled={isRedeeming}
                  >
                    {isRedeeming ? "Resgatando..." : "Resgatar"}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="text-xs text-white/60">
              Você precisa de um código bônus para obter acesso Pro. Entre em contato com um administrador.
            </CardFooter>
          </Card>
        )}
        
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
              Entre em contato com um administrador para solicitar acesso Pro ou resgate um código promocional.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
