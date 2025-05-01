
export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Em um ambiente real, isso seria gerenciado de forma segura
  role: "user" | "pro" | "admin";
  proExpiresAt?: Date; // Data de expiração do acesso Pro
  createdAt: Date;
  allowedTools: string[]; // IDs das ferramentas permitidas para o usuário
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string; // Nome do ícone 
  requiresPro: boolean;
  createdAt: Date;
  createdBy: string; // ID do admin que criou
}

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};
