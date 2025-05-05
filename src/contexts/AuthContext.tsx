
import { createContext } from "react";
import { AuthContextType } from "@/types/auth.types";

// Create the Auth Context with undefined as default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);
