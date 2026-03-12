import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, signupUser } from "../lib/api";

const AUTH_STORAGE_KEY = "travelverse-auth-user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setIsReady(true);
  }, []);

  const persistUser = (nextUser) => {
    setUser(nextUser);

    if (nextUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const signup = async (payload) => signupUser(payload);

  const login = async (payload) => {
    const response = await loginUser(payload);
    persistUser(response.user);
    return response.user;
  };

  const logout = () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isReady,
        signup,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
