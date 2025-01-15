import { useAuth } from "@/providers/auth";
import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const AuthGuard: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Outlet />;
};

export default AuthGuard;
