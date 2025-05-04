
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

    // Create a regular test user
    await createUser("test@example.com", "Password123!", "user");
    console.log("Test user created with email: test@example.com and password: Password123!");

    // Create an admin user
    await createUser("admin@example.com", "AdminPass123!", "admin");
    console.log("Admin user created with email: admin@example.com and password: AdminPass123!");
  } catch (err) {
    console.error("Error in addNewAdmin:", err);
  }
};

// Helper function to create users
async function createUser(email: string, password: string, role: "admin" | "user") {
  try {
    // Check if user exists in auth.users (can't directly query due to permission issues)
    let authUserId: string | undefined;
    
    // Try to sign in first - if user exists, this will succeed
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (!signInError && signInData?.user) {
      // User exists and credentials are correct
      console.log(`User ${email} already exists, signed in successfully`);
      authUserId = signInData.user.id;
    } else {
      // If sign in fails, try to create the user
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
      } else if (signUpData?.user) {
        console.log(`Auth user ${email} created:`, signUpData.user.id);
        authUserId = signUpData.user.id;
        
        // Since we're in a development environment, let's automatically confirm the email
        // This won't work in production as it requires admin privileges
        // But we can attempt it here for testing purposes
        try {
          // Try to update user to be confirmed
          const { error: updateError } = await supabase.functions.invoke('admin-confirm-user', {
            body: { user_id: authUserId }
          });
          
          if (updateError) {
            console.error(`Could not auto-confirm email for ${email}:`, updateError);
          } else {
            console.log(`Email for ${email} confirmed automatically`);
          }
        } catch (confirmError) {
          console.error(`Error during auto-confirmation for ${email}:`, confirmError);
        }
      }
    }

    if (!authUserId) {
      console.error(`Failed to get or create auth user ID for ${email}`);
      return;
    }
    
    // Check if user already exists in our users table
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    
    if (existingError) {
      console.error(`Error checking for existing user ${email}:`, existingError);
      return;
    }
    
    if (existingUser) {
      console.log(`User ${email} already exists in users table`);
      // Update the role if user exists but role might be different
      const { error: updateError } = await supabase
        .from("users")
        .update({ role })
        .eq("id", authUserId);
        
      if (updateError) {
        console.error(`Error updating role for user ${email}:`, updateError);
      }
      return;
    }
    
    // Insert new user with auth user ID
    const { data: insertData, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          id: authUserId,
          email,
          password, // Note: This is just for reference, actual auth uses Supabase Auth
          role
        }
      ])
      .select();
      
    if (insertError) {
      console.error(`Error creating user ${email}:`, insertError);
    } else {
      console.log(`User ${email} created successfully:`, insertData);
    }
  } catch (error) {
    console.error(`Error creating user ${email}:`, error);
  }
}
