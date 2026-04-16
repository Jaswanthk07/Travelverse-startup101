import { createContext, useContext, useEffect, useState } from "react";
import {
  fetchCurrentUser,
  fetchSubscription,
  fetchUserProfile,
  loginUser,
  purchaseSubscription,
  setAuthToken,
  signupUser,
  upgradePremium,
} from "../lib/api";

const AUTH_TOKEN_KEY = "travelverse-jwt-token";

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) return null;

  const subscription = user.subscription ?? null;
  return {
    ...user,
    subscription,
    isPremium: subscription?.status === "active",
    premiumSince: subscription?.premiumSince ?? subscription?.purchasedAt ?? null,
    premiumPlan: subscription?.premiumPlan ?? subscription?.planId ?? null,
  };
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [isUpgradingPass, setIsUpgradingPass] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!storedToken) {
      setIsReady(true);
      return;
    }

    setAuthToken(storedToken);
    setToken(storedToken);

    fetchCurrentUser()
      .then((response) => setUser(normalizeUser(response.user)))
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
    setUser(normalizeUser(nextUser));

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
    return normalizeUser(response.user);
  };

  const logout = () => {
    persistSession("", null);
  };

  const refreshUser = async () => {
    const response = await fetchUserProfile();
    const normalized = normalizeUser(response);
    setUser(normalized);
    return normalized;
  };

  const refreshSubscription = async () => {
    const response = await fetchSubscription();
    if (response.subscription && user) {
      setUser(
        normalizeUser({
          ...user,
          subscription: response.subscription,
        })
      );
    }
    return response;
  };

  const activateTravelerPass = async (payload) => {
    setIsUpgradingPass(true);
    try {
      const response = await purchaseSubscription(payload);
      setUser(normalizeUser(response.user));
      return response;
    } finally {
      setIsUpgradingPass(false);
    }
  };

  const upgradeToPremium = async (payload) => {
    setIsUpgradingPass(true);
    try {
      const response = await upgradePremium(payload);
      setUser(normalizeUser(response.user));
      return response;
    } finally {
      setIsUpgradingPass(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isReady,
        isUpgradingPass,
        signup,
        login,
        logout,
        refreshUser,
        refreshSubscription,
        activateTravelerPass,
        upgradeToPremium,
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
