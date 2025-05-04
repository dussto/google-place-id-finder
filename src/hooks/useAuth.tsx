
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
    // Set up auth state change listener FIRST
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === "SIGNED_IN" && session) {
          try {
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
          } catch (error: any) {
            console.error("Error in auth state change:", error.message);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
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
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      
      // Clear any previous user state
      setUser(null);
      
      // First attempt to sign in with Supabase auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error("Auth error:", signInError);
        throw new Error("Invalid email or password");
      }
      
      if (!signInData?.user) {
        console.error("No user returned from sign in");
        throw new Error("Login failed. Please try again.");
      }
      
      console.log("Auth successful, getting user profile data");
      
      // Get user profile data from our database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, role")
        .eq("id", signInData.user.id)
        .maybeSingle();
      
      if (userError) {
        console.error("Error fetching user data:", userError);
        throw new Error("Failed to load user profile");
      }
      
      if (!userData) {
        console.error("No user profile found");
        
        // If no user profile exists, attempt to create one
        console.log("Creating user profile for", signInData.user.id);
        const { data: insertData, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: signInData.user.id,
              email,
              password: "stored-in-auth-only", // Just a placeholder
              role: "user" // Default role
            }
          ])
          .select();
          
        if (insertError) {
          console.error("Error creating user profile:", insertError);
          throw new Error("Failed to create user profile");
        }
        
        if (insertData && insertData.length > 0) {
          setUser(insertData[0] as User);
          setIsAdmin(insertData[0].role === "admin");
        }
      } else {
        // Update local state
        setUser(userData);
        setIsAdmin(userData.role === "admin");
      }
      
      toast({
        title: "Login successful",
        description: "You have been logged in successfully",
      });
      
      // Redirect based on role
      if (userData?.role === "admin") {
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
      throw error;
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
      console.error("Logout error:", error);
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
