import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useTools } from "@/contexts/ToolsContext";
import { User, BonusCode, CodeRedemption } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Trash, Edit, User as UserIcon, Calculator, Wrench as WrenchIcon, Settings as SettingsIcon, Gift as GiftIcon } from "lucide-react";

const AdminPage = () => {
  const { user } = useAuth();
  const { tools, addTool, updateTool, deleteTool } = useTools();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [proDuration, setProDuration] = useState(30); // Dias por padrão
  const [userTools, setUserTools] = useState<string[]>([]);
  
  const [newToolName, setNewToolName] = useState("");
  const [newToolDescription, setNewToolDescription] = useState("");
  const [newToolUrl, setNewToolUrl] = useState("");
  const [newToolIcon, setNewToolIcon] = useState("calculator");
  const [newToolRequiresPro, setNewToolRequiresPro] = useState(false);

  // Estados para códigos bônus
  const [bonusCodes, setBonusCodes] = useState<BonusCode[]>([]);
  const [codeRedemptions, setCodeRedemptions] = useState<CodeRedemption[]>([]);
  const [newCode, setNewCode] = useState("");
  const [newCodeDuration, setNewCodeDuration] = useState(30);
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(1);
  const [newCodeExpiry, setNewCodeExpiry] = useState<string>("");
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddToolDialogOpen, setIsAddToolDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isAddBonusCodeDialogOpen, setIsAddBonusCodeDialogOpen] = useState(false);

  useEffect(() => {
    // Redireciona se não for admin
    if (user && user.role !== "admin") {
      toast({
        title: "Acesso restrito",
        description: "Você não tem permissões de administrador",
        variant: "destructive",
      });
      navigate("/");
    }
    
    // Carrega usuários do localStorage
    const storedUsers = localStorage.getItem("users");
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }

    // Carrega códigos bônus do Supabase
    const fetchBonusCodes = async () => {
      if (user && user.role === "admin") {
        try {
          const { data, error } = await supabase
            .from('bonus_codes')
            .select('*')
            .order('created_at', { ascending: false });
            
          if (error) throw error;
          setBonusCodes(data || []);
        } catch (error) {
          console.error('Erro ao carregar códigos bônus:', error);
          toast({
            title: "Erro ao carregar códigos",
            description: "Não foi possível carregar os códigos bônus",
            variant: "destructive",
          });
        }

        // Carrega resgates de códigos
        try {
          const { data, error } = await supabase
            .from('code_redemptions')
            .select('*')
            .order('redeemed_at', { ascending: false });
            
          if (error) throw error;
          setCodeRedemptions(data || []);
        } catch (error) {
          console.error('Erro ao carregar resgates:', error);
        }
      }
    };

    fetchBonusCodes();
  }, [user, navigate]);

  // Atualização de usuários no localStorage
  const updateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
  };

  const handleAddUser = () => {
    if (!newUsername || !newEmail || !newPassword) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Verifica se o email já está em uso
    const existingUser = users.find(u => u.email === newEmail);
    if (existingUser) {
      toast({
        title: "Erro ao adicionar usuário",
        description: "Este email já está em uso",
        variant: "destructive",
      });
      return;
    }

    const defaultTools = ["calc-eng", "calc-ele"];
    let proExpiry = undefined;
    
    // Se for usuário Pro, definimos a data de expiração
    if (newRole === "pro") {
      proExpiry = new Date(Date.now() + proDuration * 24 * 60 * 60 * 1000);
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: newUsername,
      email: newEmail,
      password: newPassword,
      role: newRole as "user" | "pro" | "admin",
      proExpiresAt: proExpiry,
      createdAt: new Date(),
      allowedTools: userTools.length > 0 ? userTools : defaultTools
    };

    const updatedUsers = [...users, newUser];
    updateUsers(updatedUsers);

    // Limpar formulário
    setNewUsername("");
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    setProDuration(30);
    setUserTools([]);
    setIsAddUserDialogOpen(false);

    toast({
      title: "Usuário adicionado",
      description: `${newUsername} foi adicionado com sucesso.`,
    });
  };

  const handleEditUser = () => {
    if (!editingUser || !editingUser.username || !editingUser.email) {
      toast({
        title: "Erro ao atualizar usuário",
        description: "Dados de usuário inválidos",
        variant: "destructive",
      });
      return;
    }

    let proExpiry = editingUser.proExpiresAt;
    
    // Se alteramos de normal para pro ou se já é pro e alteramos a duração
    if (editingUser.role === "pro") {
      proExpiry = new Date(Date.now() + proDuration * 24 * 60 * 60 * 1000);
    } else {
      proExpiry = undefined;
    }

    const updatedUser = {
      ...editingUser,
      proExpiresAt: proExpiry,
      allowedTools: userTools
    };

    const updatedUsers = users.map(u => 
      u.id === editingUser.id ? updatedUser : u
    );

    updateUsers(updatedUsers);
    setIsEditUserDialogOpen(false);

    toast({
      title: "Usuário atualizado",
      description: `${editingUser.username} foi atualizado com sucesso.`,
    });
  };

  const handleDeleteUser = (userId: string) => {
    // Impede que o admin atual seja excluído
    if (user && userId === user.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir seu próprio usuário",
        variant: "destructive",
      });
      return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    updateUsers(updatedUsers);

    toast({
      title: "Usuário excluído",
      description: "O usuário foi removido com sucesso.",
    });
  };

  const openEditUserDialog = (selectedUser: User) => {
    setEditingUser(selectedUser);
    setUserTools(selectedUser.allowedTools);
    setProDuration(30); // Valor padrão
    setIsEditUserDialogOpen(true);
  };

  const handleAddTool = () => {
    if (!newToolName || !newToolUrl) {
      toast({
        title: "Erro ao adicionar ferramenta",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    addTool({
      name: newToolName,
      description: newToolDescription,
      url: newToolUrl,
      icon: newToolIcon,
      requiresPro: newToolRequiresPro
    });

    // Limpar formulário
    setNewToolName("");
    setNewToolDescription("");
    setNewToolUrl("");
    setNewToolIcon("calculator");
    setNewToolRequiresPro(false);
    setIsAddToolDialogOpen(false);
  };

  // Função para gerar código bônus
  const handleAddBonusCode = async () => {
    if (!newCode || !newCodeDuration || !newCodeMaxUses) {
      toast({
        title: "Erro ao criar código",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calcula a data de expiração se fornecida
      let expiresAt = null;
      if (newCodeExpiry) {
        expiresAt = new Date(newCodeExpiry).toISOString();
      }

      const { data, error } = await supabase
        .from('bonus_codes')
        .insert({
          code: newCode.toUpperCase(),
          created_by: user?.id,
          expires_at: expiresAt,
          duration_days: newCodeDuration,
          max_uses: newCodeMaxUses,
          current_uses: 0,
          is_active: true
        })
        .select();

      if (error) throw error;

      // Atualiza a lista de códigos
      if (data && data.length > 0) {
        setBonusCodes([data[0], ...bonusCodes]);
      }

      // Limpa o formulário
      setNewCode("");
      setNewCodeDuration(30);
      setNewCodeMaxUses(1);
      setNewCodeExpiry("");
      setIsAddBonusCodeDialogOpen(false);

      toast({
        title: "Código criado com sucesso",
        description: `O código ${newCode.toUpperCase()} foi criado e está disponível para resgate.`,
      });
    } catch (error) {
      console.error('Erro ao criar código bônus:', error);
      toast({
        title: "Erro ao criar código",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Função para desativar código bônus
  const handleDeactivateCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('bonus_codes')
        .update({ is_active: false })
        .eq('id', codeId);

      if (error) throw error;

      // Atualiza a lista de códigos
      setBonusCodes(bonusCodes.map(code => 
        code.id === codeId ? { ...code, is_active: false } : code
      ));

      toast({
        title: "Código desativado",
        description: "O código foi desativado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao desativar código:', error);
      toast({
        title: "Erro ao desativar código",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getDaysRemaining = (expiryDate: Date | undefined | null) => {
    if (!expiryDate) return 0;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Layout title="Painel Admin">
      {user?.role === "admin" ? (
        <div className="space-y-8">
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
              <TabsTrigger value="bonus-codes">Códigos Bônus</TabsTrigger>
            </TabsList>
            
            {/* Aba de Usuários */}
            <TabsContent value="users" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gerenciar Usuários</h2>
                
                <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus size={16} className="mr-1" /> Adicionar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card">
                    <DialogHeader>
                      <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes abaixo para criar um novo usuário.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Nome de usuário</Label>
                        <Input
                          id="username"
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          className="bg-black/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="bg-black/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-black/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Tipo de usuário</Label>
                        <Select value={newRole} onValueChange={setNewRole}>
                          <SelectTrigger className="bg-black/50">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário Padrão</SelectItem>
                            <SelectItem value="pro">Usuário Pro</SelectItem>
                            <SelectItem value="admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {newRole === "pro" && (
                        <div className="space-y-2">
                          <Label htmlFor="pro-duration">Duração do acesso Pro (dias)</Label>
                          <Input
                            id="pro-duration"
                            type="number"
                            min={1}
                            value={proDuration}
                            onChange={(e) => setProDuration(parseInt(e.target.value))}
                            className="bg-black/50"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Ferramentas permitidas</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {tools.map((tool) => (
                            <div key={tool.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`tool-${tool.id}`}
                                checked={userTools.includes(tool.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setUserTools([...userTools, tool.id]);
                                  } else {
                                    setUserTools(userTools.filter(id => id !== tool.id));
                                  }
                                }}
                              />
                              <Label htmlFor={`tool-${tool.id}`} className="text-sm">
                                {tool.name}
                                {tool.requiresPro && (
                                  <span className="text-orange-400 ml-1 text-xs">(Pro)</span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAddUser}>
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                {/* Dialog para edição de usuário */}
                <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
                  <DialogContent className="glass-card">
                    <DialogHeader>
                      <DialogTitle>Editar Usuário</DialogTitle>
                      <DialogDescription>
                        Modifique os detalhes do usuário abaixo.
                      </DialogDescription>
                    </DialogHeader>
                    
                    {editingUser && (
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-username">Nome de usuário</Label>
                          <Input
                            id="edit-username"
                            value={editingUser.username}
                            onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                            className="bg-black/50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-email">Email</Label>
                          <Input
                            id="edit-email"
                            type="email"
                            value={editingUser.email}
                            onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                            className="bg-black/50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-role">Tipo de usuário</Label>
                          <Select 
                            value={editingUser.role} 
                            onValueChange={(value) => setEditingUser({...editingUser, role: value as "user" | "pro" | "admin"})}
                          >
                            <SelectTrigger className="bg-black/50">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">Usuário Padrão</SelectItem>
                              <SelectItem value="pro">Usuário Pro</SelectItem>
                              <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {editingUser.role === "pro" && (
                          <div className="space-y-2">
                            <Label htmlFor="edit-pro-duration">Nova duração do acesso Pro (dias)</Label>
                            <Input
                              id="edit-pro-duration"
                              type="number"
                              min={1}
                              value={proDuration}
                              onChange={(e) => setProDuration(parseInt(e.target.value))}
                              className="bg-black/50"
                            />
                            <p className="text-xs text-orange-400">
                              {editingUser.proExpiresAt ? 
                                `Expira em: ${formatDate(editingUser.proExpiresAt)} (${getDaysRemaining(editingUser.proExpiresAt)} dias restantes)` : 
                                "Novo acesso Pro"
                              }
                            </p>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label>Ferramentas permitidas</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {tools.map((tool) => (
                              <div key={tool.id} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`edit-tool-${tool.id}`}
                                  checked={userTools.includes(tool.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setUserTools([...userTools, tool.id]);
                                    } else {
                                      setUserTools(userTools.filter(id => id !== tool.id));
                                    }
                                  }}
                                />
                                <Label htmlFor={`edit-tool-${tool.id}`} className="text-sm">
                                  {tool.name}
                                  {tool.requiresPro && (
                                    <span className="text-orange-400 ml-1 text-xs">(Pro)</span>
                                  )}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleEditUser}>
                        Salvar Alterações
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Lista de Usuários ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Pro Expira em</TableHead>
                        <TableHead>Ferramentas</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.username}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            {u.role === "admin" ? (
                              <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full text-xs">
                                Admin
                              </span>
                            ) : u.role === "pro" ? (
                              <span className="bg-orange-300/20 text-orange-300 px-2 py-0.5 rounded-full text-xs">
                                Pro
                              </span>
                            ) : (
                              <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full text-xs">
                                Padrão
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.role === "pro" ? (
                              <div>
                                <div>{formatDate(u.proExpiresAt)}</div>
                                <div className="text-xs text-orange-400">
                                  {getDaysRemaining(u.proExpiresAt)} dias restantes
                                </div>
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {u.allowedTools.includes("all") ? (
                                "Todas as ferramentas"
                              ) : (
                                `${u.allowedTools.length} ferramenta(s)`
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openEditUserDialog(u)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit size={16} />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteUser(u.id)}
                                className="h-8 w-8 p-0 hover:text-red-500"
                                disabled={user?.id === u.id}
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Aba de Ferramentas */}
            <TabsContent value="tools" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gerenciar Ferramentas</h2>
                
                <Dialog open={isAddToolDialogOpen} onOpenChange={setIsAddToolDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus size={16} className="mr-1" /> Adicionar Ferramenta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card">
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Ferramenta</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes abaixo para criar uma nova ferramenta.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="tool-name">Nome da ferramenta</Label>
                        <Input
                          id="tool-name"
                          value={newToolName}
                          onChange={(e) => setNewToolName(e.target.value)}
                          className="bg-black/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tool-description">Descrição</Label>
                        <Input
                          id="tool-description"
                          value={newToolDescription}
                          onChange={(e) => setNewToolDescription(e.target.value)}
                          className="bg-black/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tool-url">URL (caminho na aplicação)</Label>
                        <Input
                          id="tool-url"
                          value={newToolUrl}
                          onChange={(e) => setNewToolUrl(e.target.value)}
                          placeholder="/tools/nome-da-ferramenta"
                          className="bg-black/50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="tool-icon">Ícone</Label>
                        <Select value={newToolIcon} onValueChange={setNewToolIcon}>
                          <SelectTrigger className="bg-black/50">
                            <SelectValue placeholder="Selecione um ícone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="calculator">Calculadora</SelectItem>
                            <SelectItem value="calculator-2">Calculadora 2</SelectItem>
                            <SelectItem value="wrench">Chave</SelectItem>
                            <SelectItem value="settings">Configurações</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="tool-pro" 
                          checked={newToolRequiresPro}
                          onCheckedChange={(checked) => setNewToolRequiresPro(!!checked)}
                        />
                        <Label htmlFor="tool-pro">Requer acesso Pro</Label>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddToolDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAddTool}>
                        Adicionar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Lista de Ferramentas ({tools.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>URL</TableHead>
                        <TableHead>Requer Pro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tools.map((tool) => (
                        <TableRow key={tool.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              {tool.icon === "calculator" && <Calculator size={16} />}
                              {tool.icon === "calculator-2" && <Calculator size={16} />}
                              {tool.icon === "wrench" && <WrenchIcon size={16} />}
                              {tool.icon === "settings" && <SettingsIcon size={16} />}
                              <span>{tool.name}</span>
                            </div>
                          </TableCell>
                          
                          <TableCell>{tool.description}</TableCell>
                          <TableCell className="font-mono text-xs">{tool.url}</TableCell>
                          <TableCell>
                            {tool.requiresPro ? (
                              <span className="bg-orange-300/20 text-orange-300 px-2 py-0.5 rounded-full text-xs">
                                Pro
                              </span>
                            ) : (
                              <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full text-xs">
                                Não
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteTool(tool.id)}
                              className="h-8 w-8 p-0 hover:text-red-500"
                            >
                              <Trash size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Nova Aba de Códigos Bônus */}
            <TabsContent value="bonus-codes" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Gerenciar Códigos Bônus</h2>
                
                <Dialog open={isAddBonusCodeDialogOpen} onOpenChange={setIsAddBonusCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus size={16} className="mr-1" /> Criar Código Bônus
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card">
                    <DialogHeader>
                      <DialogTitle>Criar Novo Código Bônus</DialogTitle>
                      <DialogDescription>
                        Crie um código que usuários podem resgatar para obter acesso Pro temporário.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="bonus-code">Código</Label>
                        <Input
                          id="bonus-code"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                          placeholder="PROMO2023"
                          className="bg-black/50 uppercase"
                        />
                        <p className="text-xs text-white/60">Digite um código alfanumérico único</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="duration-days">Duração do acesso Pro (dias)</Label>
                        <Input
                          id="duration-days"
                          type="number"
                          min={1}
                          value={newCodeDuration}
                          onChange={(e) => setNewCodeDuration(parseInt(e.target.value))}
                          className="bg-black/50"
                        />
                        <p className="text-xs text-white/60">Quantos dias de acesso Pro o usuário ganha ao resgatar</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="max-uses">Quantidade máxima de usos</Label>
                        <Input
                          id="max-uses"
                          type="number"
                          min={1}
                          value={newCodeMaxUses}
                          onChange={(e) => setNewCodeMaxUses(parseInt(e.target.value))}
                          className="bg-black/50"
                        />
                        <p className="text-xs text-white/60">Quantas vezes este código pode ser resgatado no total</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="expiry-date">Data de expiração (opcional)</Label>
                        <Input
                          id="expiry-date"
                          type="date"
                          value={newCodeExpiry}
                          onChange={(e) => setNewCodeExpiry(e.target.value)}
                          className="bg-black/50"
                        />
                        <p className="text-xs text-white/60">Data após a qual o código não pode mais ser resgatado</p>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddBonusCodeDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAddBonusCode}>
                        Criar Código
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Códigos Bônus Ativos ({bonusCodes.filter(code => code.is_active).length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Usos</TableHead>
                        <TableHead>Expira em</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bonusCodes.map((code) => (
                        <TableRow key={code.id} className={!code.is_active ? "opacity-60" : ""}>
                          <TableCell className="font-mono font-medium">{code.code}</TableCell>
                          <TableCell>{code.duration_days} dias</TableCell>
                          <TableCell>{code.current_uses} / {code.max_uses}</TableCell>
                          <TableCell>
                            {code.expires_at ? (
                              <div>
                                <div>{formatDate(code.expires_at)}</div>
                                <div className="text-xs text-orange-400">
                                  {getDaysRemaining(code.expires_at) > 0 ? 
                                    `${getDaysRemaining(code.expires_at)} dias restantes` : 
                                    "Expirado"}
                                </div>
                              </div>
                            ) : (
                              "Sem expiração"
                            )}
                          </TableCell>
                          <TableCell>
                            {code.is_active ? (
                              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs">
                                Ativo
                              </span>
                            ) : (
                              <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-xs">
                                Desativado
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {code.is_active && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeactivateCode(code.id)}
                                className="h-8 w-8 p-0 hover:text-red-500"
                              >
                                <Trash size={16} />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {bonusCodes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-white/60">
                            Nenhum código bônus encontrado. Crie um novo código para começar.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="bg-black/20 border-t border-white/10 px-6 py-3">
                  <p className="text-xs text-white/60">
                    Os códigos bônus permitem que você ofereça acesso Pro temporário aos usuários. 
                    Cada código pode ser usado uma quantidade limitada de vezes.
                  </p>
                </CardFooter>
              </Card>

              {/* Lista de resgates de códigos */}
              {codeRedemptions.length > 0 && (
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Histórico de Resgates ({codeRedemptions.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuário</TableHead>
                          <TableHead>Código</TableHead>
                          <TableHead>Data de Resgate</TableHead>
                          <TableHead>Pro até</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {codeRedemptions.map((redemption) => {
                          const user = users.find(u => u.id === redemption.user_id);
                          const code = bonusCodes.find(c => c.id === redemption.code_id);
                          return (
                            <TableRow key={redemption.id}>
                              <TableCell>
                                {user ? user.username : redemption.user_id}
                              </TableCell>
                              <TableCell className="font-mono">
                                {code ? code.code : "Código desconhecido"}
                              </TableCell>
                              <TableCell>{formatDate(redemption.redeemed_at)}</TableCell>
                              <TableCell>
                                <div>{formatDate(redemption.pro_expires_at)}</div>
                                <div className="text-xs text-orange-400">
                                  {getDaysRemaining(redemption.pro_expires_at) > 0 ? 
                                    `${getDaysRemaining(redemption.pro_expires_at)} dias restantes` : 
                                    "Expirado"}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[50vh]">
          <p>Carregando...</p>
        </div>
      )}
    </Layout>
  );
};

export default AdminPage;
