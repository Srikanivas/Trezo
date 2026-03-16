import React, { createContext, useState, useEffect, ReactNode } from "react";
import { Company, companyAPI } from "../services/api";

export interface AuthContextType {
  company: Company | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (companyName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCompany: (company: Company) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth on mount
    const storedToken = sessionStorage.getItem("trezo_token");
    const storedCompany = sessionStorage.getItem("trezo_company");

    if (storedToken && storedCompany) {
      try {
        const parsedCompany = JSON.parse(storedCompany);
        setToken(storedToken);
        setCompany(parsedCompany);
      } catch (error) {
        console.error("Error parsing stored company data:", error);
        sessionStorage.removeItem("trezo_token");
        sessionStorage.removeItem("trezo_company");
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await companyAPI.login({ email, password });

      if (response.success && response.data) {
        const { token: newToken, company: newCompany } = response.data;

        setToken(newToken);
        setCompany(newCompany);

        sessionStorage.setItem("trezo_token", newToken);
        sessionStorage.setItem("trezo_company", JSON.stringify(newCompany));

        return { success: true };
      } else {
        return { success: false, error: response.error || "Login failed" };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Network error occurred",
      };
    }
  };

  const register = async (companyName: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await companyAPI.register({ companyName, email, password });

      if (response.success && response.data) {
        const { token: newToken, company: newCompany } = response.data;

        setToken(newToken);
        setCompany(newCompany);

        sessionStorage.setItem("trezo_token", newToken);
        sessionStorage.setItem("trezo_company", JSON.stringify(newCompany));

        return { success: true };
      } else {
        return { success: false, error: response.error || "Registration failed" };
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Network error occurred",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setCompany(null);
    sessionStorage.removeItem("trezo_token");
    sessionStorage.removeItem("trezo_company");
  };

  const updateCompany = (updatedCompany: Company) => {
    setCompany(updatedCompany);
    sessionStorage.setItem("trezo_company", JSON.stringify(updatedCompany));
  };

  const value: AuthContextType = {
    company,
    token,
    isLoading,
    login,
    register,
    logout,
    updateCompany,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
