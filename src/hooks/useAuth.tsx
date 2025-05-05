
import { useAuthContext } from "./useAuthContext";

export function useAuth() {
  return useAuthContext();
}

// Re-export the AuthProvider for convenience
export { AuthProvider } from "@/providers/AuthProvider";
export type { User } from "@/types/auth.types";
