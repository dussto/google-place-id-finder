
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
          console.log("Session found:", sessionData.session.user.id);
          
          // Get the user data from our users table
          const { data: userData, error } = await supabase
            .from("users")
            .select("id, email, role")
            .eq("id", sessionData.session.user.id)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching user data:", error);
            throw error;
          }

          if (userData) {
            console.log("User data found:", userData);
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
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === "SIGNED_IN" && session) {
          // Get user details on sign in
          const { data, error } = await supabase
            .from("users")
            .select("id, email, role")
            .eq("id", session.user.id)
            .maybeSingle();
          
          if (data) {
            console.log("User data after sign in:", data);
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
      console.log("Attempting login for:", email);
      
      // First, get the user from our users table
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, password, role")
        .eq("email", email)
        .maybeSingle();
      
      if (userError) {
        console.error("Error checking user:", userError);
        throw new Error("Login failed. Please try again.");
      }
      
      if (!userData) {
        console.error("No user found with email:", email);
        throw new Error("Invalid email or password");
      }
      
      // Simple password check
      if (userData.password !== password) {
        console.error("Password mismatch for:", email);
        throw new Error("Invalid email or password");
      }
      
      console.log("User verified, signing in with Supabase auth");
      
      // If validation passes, sign in with Supabase auth
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Supabase auth error:", error);
        
        // If the user doesn't exist in auth yet, sign them up
        if (error.message.includes("Email not confirmed") || 
            error.message.includes("Invalid login credentials")) {
          console.log("Attempting to sign up user first");
          
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });
          
          if (signUpError) {
            console.error("Sign up error:", signUpError);
            throw signUpError;
          }
          
          // Try logging in again after signup
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retryError) {
            console.error("Retry login error:", retryError);
            throw retryError;
          }
        } else {
          throw error;
        }
      }
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      });
      
      // Set user data and redirect
      setUser({
        id: userData.id,
        email: userData.email,
        role: userData.role,
      });
      
      setIsAdmin(userData.role === "admin");
      
      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/");
      }
    } catch (error: any) {
      console.error("Login process error:", error);
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
      setUser(null);
      setIsAdmin(false);
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
