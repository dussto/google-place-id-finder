
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
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", "dusan@example.com")
      .single();
    
    if (existingUser) {
      console.log("Admin user already exists");
      return;
    }
    
    // Insert new admin user
    const { error } = await supabase
      .from("users")
      .insert([
        {
          email: "dusan@example.com",
          password: "Lolovanje!13",
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
