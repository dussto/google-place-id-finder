
export type User = {
  id: string;
  email: string;
  role: "admin" | "user";
};

export type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean }>;
  logout: () => Promise<{ success: boolean }>;
};
