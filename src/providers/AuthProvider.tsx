
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/contexts/AuthContext";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useLogin } from "@/hooks/useLogin";
import { useLogout } from "@/hooks/useLogout";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useSupabaseAuth();
  const { login } = useLogin();
  const { logout } = useLogout();

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
