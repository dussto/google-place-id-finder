
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { AuthContext } from "@/contexts/AuthContext";
import { User } from "@/types/auth.types";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state change listener FIRST
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (event === "SIGNED_IN" && session) {
          // When signed in, get the user data
          const userId = session.user.id;
          
          // First, set the basic user info from auth
          const tempUser = {
            id: userId,
            email: session.user.email || "",
            role: "user" as "admin" | "user" // Default role, will update from DB
          };
          
          setUser(tempUser);
          
          // Then fetch complete user profile from our users table
          setTimeout(async () => {
            try {
              const { data, error } = await supabase
                .from("users")
                .select("id, email, role")
                .eq("id", userId)
                .maybeSingle();
              
              if (error) {
                console.error("Error fetching user profile after sign in:", error);
                return;
              }

              if (data) {
                console.log("User profile found:", data);
                setUser(data);
                setIsAdmin(data.role === "admin");
              } else {
                console.log("No user profile found in users table for:", userId);
              }
            } catch (err) {
              console.error("Error in delayed profile fetch:", err);
            }
          }, 0);
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
          } else {
            // If no user profile exists but we have an auth session
            console.log("User authenticated but no profile found in users table");
            
            // Create a basic user object from session data
            setUser({
              id: sessionData.session.user.id,
              email: sessionData.session.user.email || "",
              role: "user" // Default role
            });
          }
        } else {
          console.log("No session found");
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
      setIsSubmitting(true);
      
      // Clear any previous user state
      setUser(null);
      
      // First attempt to sign in with Supabase auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error("Auth error:", signInError);
        throw new Error(signInError.message || "Invalid email or password");
      }
      
      if (!signInData?.user) {
        console.error("No user returned from sign in");
        throw new Error("Login failed. Please try again.");
      }
      
      console.log("Auth successful, user logged in:", signInData.user.id);
      
      // Get user profile data from our database
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id, email, role")
        .eq("id", signInData.user.id)
        .maybeSingle();
      
      if (userError) {
        console.error("Error fetching user data:", userError);
        // Not throwing error here as we can continue with auth data
      }
      
      if (userData) {
        // Update local state with full user profile
        setUser(userData);
        setIsAdmin(userData.role === "admin");
      } else {
        // If no profile exists, use basic auth data
        console.log("No user profile found, using auth data");
        setUser({
          id: signInData.user.id,
          email: signInData.user.email || "",
          role: "user" // Default role
        });
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = async () => {
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
