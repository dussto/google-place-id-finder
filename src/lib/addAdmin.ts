
import { supabase } from "@/integrations/supabase/client";

export const addNewAdmin = async () => {
  try {
    // First fix the is_admin function's search path
    const { error: functionError } = await supabase.rpc('fix_is_admin_function');
    
    if (functionError) {
      console.error("Error fixing is_admin function:", functionError);
    } else {
      console.log("is_admin function fixed successfully");
    }

    // Create test and admin users
    await createOrUpdateUser("test@example.com", "Password123!", "user");
    await createOrUpdateUser("admin@example.com", "AdminPass123!", "admin");
  } catch (err) {
    console.error("Error in addNewAdmin:", err);
  }
};

// Helper function to create or update users
async function createOrUpdateUser(email: string, password: string, role: "admin" | "user") {
  try {
    console.log(`Attempting to create or update user: ${email}`);
    
    // Check if user already exists in auth
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();
    
    if (userDataError) {
      console.error(`Error checking for existing user ${email}:`, userDataError);
      return;
    }
    
    if (userData) {
      console.log(`User ${email} exists, updating role to ${role}`);
      
      // Update the existing user's role
      const { error: updateError } = await supabase
        .from("users")
        .update({ role, password })
        .eq("email", email);
      
      if (updateError) {
        console.error(`Error updating user ${email}:`, updateError);
      } else {
        console.log(`Updated ${email} role to ${role}`);
      }
      
      return;
    }
    
    // If user doesn't exist, create a new one in auth system
    console.log(`Creating new user: ${email}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role }
      }
    });
    
    if (signUpError) {
      console.error(`Error creating auth user ${email}:`, signUpError);
      return;
    }
    
    const userId = signUpData?.user?.id;
    if (!userId) {
      console.error(`Failed to get user ID for ${email}`);
      return;
    }
    
    console.log(`Auth user ${email} created with ID: ${userId}`);
    
    // Auto-confirm the email
    try {
      const { error: confirmError } = await supabase.functions.invoke('admin-confirm-user', {
        body: { user_id: userId }
      });
      
      if (confirmError) {
        console.error(`Failed to auto-confirm email for ${email}:`, confirmError);
      } else {
        console.log(`Email for ${email} confirmed automatically`);
      }
    } catch (confirmError) {
      console.error(`Error during email confirmation for ${email}:`, confirmError);
    }
    
    // Insert into users table
    const { error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          email,
          password, // Note: Storing password in users table for reference
          role
        }
      ]);
      
    if (insertError) {
      console.error(`Error adding ${email} to users table:`, insertError);
    } else {
      console.log(`User ${email} with role ${role} created successfully`);
    }
  } catch (error) {
    console.error(`Error in createOrUpdateUser for ${email}:`, error);
  }
}
