import { createContext, useContext, useEffect, useState } from "react";
import { fetchCurrentUser, loginUser, setAuthToken, signupUser } from "../lib/api";

const AUTH_TOKEN_KEY = "travelverse-jwt-token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!storedToken) {
      setIsReady(true);
      return;
    }

    setAuthToken(storedToken);
    setToken(storedToken);

    fetchCurrentUser()
      .then((response) => setUser(response.user))
      .catch(() => {
        setAuthToken("");
        setToken("");
        setUser(null);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      })
      .finally(() => setIsReady(true));
  }, []);

  const persistSession = (nextToken, nextUser) => {
    setAuthToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);

    if (nextToken) {
      localStorage.setItem(AUTH_TOKEN_KEY, nextToken);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  };

  const signup = async (payload) => signupUser(payload);

  const login = async (payload) => {
    const response = await loginUser(payload);
    persistSession(response.token, response.user);
    return response.user;
  };

  const logout = () => {
    persistSession("", null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
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
