
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Settings } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleAdminPanel = () => {
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-orange-900/30 px-6 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 
              className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 cursor-pointer"
              onClick={() => navigate("/")}
            >
              EngiTools Pro
            </h1>
            {title && (
              <>
                <span className="text-orange-600">/</span>
                <span className="text-xl text-white/80">{title}</span>
              </>
            )}
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 rounded-full bg-orange-500/10 px-4 py-2">
                <User size={16} className="text-orange-400" />
                <span className="text-sm font-medium">
                  {user.username}
                  {user.role === "admin" && (
                    <span className="ml-2 bg-orange-500 text-black text-xs px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                  {user.role === "pro" && (
                    <span className="ml-2 bg-orange-300 text-black text-xs px-2 py-0.5 rounded-full">
                      Pro
                    </span>
                  )}
                </span>
              </div>
              
              {user.role === "admin" && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleAdminPanel} 
                  className="border-orange-800 hover:bg-orange-500/20 hover:text-orange-300"
                >
                  <Settings size={16} className="mr-1" />
                  Admin
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout} 
                className="hover:bg-orange-500/20 hover:text-orange-300"
              >
                <LogOut size={16} className="mr-1" />
                Sair
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-8">
        {children}
      </main>

      <footer className="border-t border-orange-900/30 px-6 py-4 text-center text-sm text-white/50">
        <p>EngiTools Pro &copy; {new Date().getFullYear()} - Todos os direitos reservados</p>
      </footer>
    </div>
  );
};

export default Layout;
