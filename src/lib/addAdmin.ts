
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
    
    // Check if auth user exists first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (authError && !authError.message.includes("Email not confirmed")) {
      console.log("Admin auth user doesn't exist, creating...");
      
      // Create the auth user first
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword
      });
      
      if (signUpError) {
        console.error("Error creating admin auth user:", signUpError);
        return;
      }
      
      console.log("Admin auth user created:", signUpData.user?.id);
    }
    
    // Check if user already exists in our users table
    const { data: existingUserQuery, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", adminEmail);
    
    if (existingError) {
      console.error("Error checking for existing user:", existingError);
      return;
    }
    
    if (existingUserQuery && existingUserQuery.length > 0) {
      console.log("Admin user already exists in users table");
      return;
    }
    
    // Get auth user ID
    const { data: authUser } = await supabase.auth.getUser();
    const userId = authUser?.user?.id;
    
    if (!userId) {
      console.error("Could not get auth user ID");
      return;
    }
    
    // Insert new admin user with auth user ID
    const { error } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          email: adminEmail,
          password: adminPassword,
          role: "admin"
        }
      ]);
      
    if (error) {
      console.error("Error creating admin user:", error);
    } else {
      console.log("Admin user created successfully");
    }
  } catch (err) {
    console.error("Error in addNewAdmin:", err);
  }
};
