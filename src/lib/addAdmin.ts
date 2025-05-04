
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
      
      const { data: authData, error: userCheckError } = await supabase.auth.admin.listUsers();
      
      if (userCheckError) {
        console.error("Error checking for existing users:", userCheckError);
      } else if (authData?.users) {
        // Type assertion to fix TypeScript error
        const users = authData.users as AuthUser[];
        const existingUser = users.find(user => user.email === email);
        
        if (existingUser) {
          console.log(`User ${email} already exists in auth:`, existingUser.id);
          authUserId = existingUser.id;
        }
      }
    } catch (error) {
      console.log(`User ${email} doesn't exist in auth yet`);
    }

    // If user doesn't exist in auth, create it
    if (!authUserId) {
      console.log(`Creating auth user ${email}...`);
      
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
        console.error(`Error creating auth user ${email}:`, signUpError);
        return;
      }
      
      if (signUpData.user) {
        console.log(`Auth user ${email} created:`, signUpData.user.id);
        authUserId = signUpData.user.id;
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
