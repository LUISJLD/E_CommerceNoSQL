import React, { createContext, useContext, useState } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getInitialAuth(): { token: string | null; user: User | null } {
  const storedToken = localStorage.getItem('ecommerce_token');
  if (!storedToken) return { token: null, user: null };
  try {
    const decoded: any = jwtDecode(storedToken);
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('ecommerce_token');
      return { token: null, user: null };
    }
    return {
      token: storedToken,
      user: { email: decoded.email, name: decoded.name, role: decoded.role },
    };
  } catch {
    localStorage.removeItem('ecommerce_token');
    return { token: null, user: null };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initial] = useState(getInitialAuth);
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);
  const [isLoading] = useState(false);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('ecommerce_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ecommerce_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
