import { createContext, useContext, useEffect, useState } from "react";
import {
  getProfile,
  loginUser,
  registerUser,
} from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(
    localStorage.getItem("club_management_token")
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await getProfile(token);
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("club_management_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await loginUser(credentials);

    localStorage.setItem("club_management_token", data.token);
    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const register = async (userData) => {
    return registerUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("club_management_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);