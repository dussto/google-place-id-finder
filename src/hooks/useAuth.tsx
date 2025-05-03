
import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active session on mount
    const getSession = async () => {
      setLoading(true);
      try {
        // Check if we have a session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          // Get the user data from our users table
          const { data: userData, error } = await supabase
            .from("users")
            .select("id, email, role")
            .eq("id", sessionData.session.user.id)
            .single();
          
          if (error) {
            throw error;
          }

          if (userData) {
            setUser(userData);
            setIsAdmin(userData.role === "admin");
          }
        }
      } catch (error: any) {
        console.error("Error fetching session:", error.message);
      } finally {
        setLoading(false);
      }
    };

    getSession();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          // Get user details on sign in
          const { data, error } = await supabase
            .from("users")
            .select("id, email, role")
            .eq("id", session.user.id)
            .single();
          
          if (data) {
            setUser(data);
            setIsAdmin(data.role === "admin");
          } else if (error) {
            console.error("Error fetching user data:", error.message);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAdmin(false);
          navigate("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      // First, check if the user exists in our users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, password, role")
        .eq("email", email)
        .maybeSingle(); // Use maybeSingle instead of single to avoid errors
      
      if (userError) {
        console.error("Error checking user:", userError);
        throw new Error("Login failed. Please try again.");
      }
      
      if (!userData) {
        throw new Error("Invalid email or password");
      }
      
      // Simple password check
      if (userData.password !== password) {
        throw new Error("Invalid email or password");
      }
      
      // If validation passes, sign in with Supabase auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      });
      
      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
