
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    
    if (user) {
      navigate("/");
    } else {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="animate-pulse text-orange-400 text-xl font-medium">
        Carregando EngiTools Pro...
      </div>
    </div>
  );
};

export default Index;
