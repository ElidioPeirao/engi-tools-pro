
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
      <img 
        src="/lovable-uploads/0285c5ed-b952-4f21-b6d7-1f9e5464c4ce.png" 
        alt="EPROJECTS Logo" 
        className="h-24 md:h-32 mb-6"
      />
      <div className="animate-pulse text-orange-400 text-xl font-medium">
        Carregando EPROJECTS...
      </div>
    </div>
  );
};

export default Index;
