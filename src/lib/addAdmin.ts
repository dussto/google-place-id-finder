
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
    console.log("Starting to create test user and admin user...");
    await createOrUpdateUser("test@example.com", "Password123!", "user");
    await createOrUpdateUser("admin@example.com", "AdminPass123!", "admin");
  } catch (err) {
    console.error("Error in addNewAdmin:", err);
  }
};

// Helper function to create or update users
async function createOrUpdateUser(email: string, password: string, role: "admin" | "user") {
  try {
    console.log(`Attempting to create or update user: ${email} with role: ${role}`);
    
    // First check if the user exists in Supabase Auth
    // Note: We can't use filter directly in listUsers as it's not supported
    const { data: authUserList } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 100
    }).catch(e => {
      console.log("Error checking auth users - this is expected in development:", e);
      return { data: null };
    });
    
    // Check if user exists by manually filtering the results
    const userExists = authUserList?.users?.some(u => u.email === email);
    
    if (userExists) {
      console.log(`User ${email} exists in Auth system, attempting to update...`);
      
      // For existing users, we need to check if they exist in our users table
      const { data: userData, error: userDataError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .maybeSingle();
      
      if (userDataError) {
        console.error(`Error checking for existing user in users table ${email}:`, userDataError);
      }
      
      if (userData) {
        // User exists in our table, update them
        const { error: updateError } = await supabase
          .from("users")
          .update({ role, password })
          .eq("email", email);
        
        if (updateError) {
          console.error(`Error updating user ${email} in users table:`, updateError);
        } else {
          console.log(`Updated ${email} in users table with role ${role}`);
        }
      } else {
        console.log(`User exists in Auth but not in users table. Will attempt to create record.`);
      }
    } else {
      // If user doesn't exist, create a new one in auth system
      console.log(`Creating new user: ${email} in Auth system`);
      
      // Create the user in the auth system using signUp
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
    }
  } catch (error) {
    console.error(`Error in createOrUpdateUser for ${email}:`, error);
  }
}
