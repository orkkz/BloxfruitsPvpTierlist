import { useState, useEffect } from "react";
import { AdminUser, LoginCredentials } from "@/lib/types";
import { login } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if we have an admin session in localStorage
  useEffect(() => {
    const adminData = localStorage.getItem("admin");
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData) as AdminUser;
        if (parsedAdmin?.id && parsedAdmin?.username) {
          setAdmin(parsedAdmin);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to parse admin data:", error);
        localStorage.removeItem("admin");
      }
    }
  }, []);

  const loginAdmin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await login(credentials);
      
      if (response.success && response.admin) {
        setAdmin(response.admin);
        setIsAuthenticated(true);
        localStorage.setItem("admin", JSON.stringify(response.admin));
        toast({
          title: "Login successful",
          description: `Welcome back, ${response.admin.username}!`,
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid username or password",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAuthenticated(false);
    localStorage.removeItem("admin");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return {
    isAuthenticated,
    admin,
    isLoading,
    login: loginAdmin,
    logout,
  };
}
