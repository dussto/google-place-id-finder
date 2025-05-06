
import { useAuthContext } from "./useAuthContext";
import { AuthProvider } from "@/providers/AuthProvider";
import type { User } from "@/types/auth.types";

export function useAuth() {
  return useAuthContext();
}

// Re-export the AuthProvider for convenience
export { AuthProvider };
export type { User };
