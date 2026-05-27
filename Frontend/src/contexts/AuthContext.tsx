import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "../shared/types";

const STREETS = [
  "Calle 15", "Carrera 7", "Calle 100", "Transversal 45", "Avenida El Dorado",
  "Calle 72", "Carrera 13", "Diagonal 127", "Calle 26", "Carrera 30",
];
const CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Santa Marta",
  "Cartagena", "Bucaramanga", "Manizales", "Pereira", "Cúcuta",
];

function randomAddress(): string {
  const street = STREETS[Math.floor(Math.random() * STREETS.length)];
  const num1   = Math.floor(Math.random() * 150) + 1;
  const num2   = Math.floor(Math.random() * 99)  + 1;
  const apt    = Math.floor(Math.random() * 900)  + 100;
  const city   = CITIES[Math.floor(Math.random() * CITIES.length)];
  return `${street} #${num1}-${num2}, Apto ${apt}, ${city}`;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (name: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "ecocart_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  const login = (name: string) => {
    const newUser: User = {
      username: name.trim().toLowerCase().replace(/\s+/g, "."),
      address: randomAddress(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
