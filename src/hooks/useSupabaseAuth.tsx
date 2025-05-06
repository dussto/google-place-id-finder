
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types/auth.types";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
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
    });

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
  }, []);

  return {
    user,
    isAdmin,
    loading
  };
}
