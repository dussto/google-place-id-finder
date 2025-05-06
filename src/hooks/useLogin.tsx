
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function useLogin() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const login = async (email: string, password: string): Promise<{ success: boolean }> => {
    try {
      setIsSubmitting(true);
      console.log("Attempting login for:", email);
      
      // Attempt to sign in with Supabase auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (signInError) {
        console.error("Auth error:", signInError);
        toast({
          title: "Login failed",
          description: signInError.message || "Invalid email or password",
          variant: "destructive",
        });
        return { success: false };
      }
      
      if (!signInData?.user) {
        console.error("No user returned from sign in");
        toast({
          title: "Login failed",
          description: "Login failed. Please try again.",
          variant: "destructive",
        });
        return { success: false };
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
      
      return { success: true };
    } catch (error: any) {
      console.error("Login process error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    login,
    isSubmitting
  };
}
