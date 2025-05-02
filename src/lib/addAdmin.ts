
import { supabase } from "@/integrations/supabase/client";

export const addNewAdmin = async () => {
  try {
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
