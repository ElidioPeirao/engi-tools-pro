
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

export interface BonusCode {
  id: string;
  code: string;
  created_by: string;
  created_at: Date;
  expires_at: Date | null;
  duration_days: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
}

export interface CodeRedemption {
  id: string;
  code_id: string;
  user_id: string;
  redeemed_at: Date;
  pro_expires_at: Date;
}

export type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};
