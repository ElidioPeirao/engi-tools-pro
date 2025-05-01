
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useTools } from "@/contexts/ToolsContext";
import { User } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { Plus, Trash, Edit, User as UserIcon, Calculator } from "lucide-react";

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
  
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isAddToolDialogOpen, setIsAddToolDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);

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

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getDaysRemaining = (expiryDate: Date | undefined) => {
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
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
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
                              {tool.icon === "calculator-2" && <Calculator2 size={16} />}
                              {tool.icon === "wrench" && <Wrench size={16} />}
                              {tool.icon === "settings" && <Settings size={16} />}
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
