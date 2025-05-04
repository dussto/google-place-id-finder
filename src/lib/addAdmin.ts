
import { supabase } from "@/integrations/supabase/client";

export const addNewAdmin = async () => {
  try {
    // First fix the is_admin function's search path
    // Using type assertion to overcome the TypeScript error
    const { error: functionError } = await supabase.rpc('fix_is_admin_function' as any);
    
    if (functionError) {
      console.error("Error fixing is_admin function:", functionError);
    } else {
      console.log("is_admin function fixed successfully");
    }

    const adminEmail = "dusan@example.com";
    const adminPassword = "Lolovanje!13";
    
    // Check if admin already exists in auth
    let authUserId: string | undefined;
    
    try {
      // Try to sign in to check if user exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword
      });
      
      if (!signInError && signInData.user) {
        console.log("Admin user exists in auth:", signInData.user.id);
        authUserId = signInData.user.id;
      }
    } catch (error) {
      console.log("Admin user doesn't exist in auth yet");
    }

    // If user doesn't exist in auth, create it
    if (!authUserId) {
      console.log("Creating admin auth user...");
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            role: "admin"
          }
        }
      });
      
      if (signUpError) {
        console.error("Error creating admin auth user:", signUpError);
        return;
      }
      
      if (signUpData.user) {
        console.log("Admin auth user created:", signUpData.user.id);
        authUserId = signUpData.user.id;
      }
    }
    
    if (!authUserId) {
      console.error("Failed to get or create auth user ID");
      return;
    }
    
    // Check if user already exists in our users table
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail)
      .maybeSingle();
    
    if (existingError) {
      console.error("Error checking for existing user:", existingError);
      return;
    }
    
    if (existingUser) {
      console.log("Admin user already exists in users table");
      return;
    }
    
    // Insert new admin user with auth user ID
    const { data: insertData, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: authUserId,
          email: adminEmail,
          password: adminPassword,
          role: "admin"
        }
      ])
      .select();
      
    if (insertError) {
      console.error("Error creating admin user:", insertError);
    } else {
      console.log("Admin user created successfully:", insertData);
    }
  } catch (err) {
    console.error("Error in addNewAdmin:", err);
  }
};
