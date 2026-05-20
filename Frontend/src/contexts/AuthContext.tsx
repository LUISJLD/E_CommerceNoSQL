import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../shared/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USER: User = {
  username: "jgarcia",
  address: "Calle 100 # 12 - 34, Apto 501, Bogotá, Colombia",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(MOCK_USER);

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    logout: () => setUser(null),
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
