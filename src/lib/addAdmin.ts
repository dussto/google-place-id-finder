
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
    // Check if user exists in auth
    let authUserId: string | undefined;
    
    try {
      // Check if user exists
      // Define the type for the auth user response to fix the TypeScript error
      type AuthUser = {
        id: string;
        email: string;
        // Add other properties as needed, but at minimum we need id and email
      };
      
      // Use signUp directly since admin.listUsers may require admin privileges
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role
          }
        }
      });
      
      if (signUpError) {
        // Check if error indicates user already exists
        if (signUpError.message.includes("already registered")) {
          console.log(`User ${email} already exists, trying to sign in...`);
          
          // Try to sign in to get the user ID
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.error(`Error signing in ${email}:`, signInError);
          } else if (signInData?.user) {
            console.log(`Found existing user ${email}:`, signInData.user.id);
            authUserId = signInData.user.id;
          }
        } else {
          console.error(`Error creating auth user ${email}:`, signUpError);
          return;
        }
      } else if (signUpData?.user) {
        console.log(`Auth user ${email} created:`, signUpData.user.id);
        authUserId = signUpData.user.id;
      }
    } catch (error) {
      console.log(`User ${email} doesn't exist in auth yet`);
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
