import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { api, clearToken, getToken, saveToken } from "@/lib/apiClient";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
});

const USER_CACHE_KEY = "@urban_user_cache";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          setLoading(false);
          return;
        }
        const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cached) {
          try {
            setUser(JSON.parse(cached));
          } catch {
            await AsyncStorage.removeItem(USER_CACHE_KEY);
          }
        }
        const { user: serverUser } = await api.auth.me();
        setUser(serverUser);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(serverUser));
      } catch {
        await clearToken();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      throw new Error("Email and password are required");
    }
    const { token, user: apiUser } = await api.auth.login(trimmedEmail, password);
    await saveToken(token);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(apiUser));
    setUser(apiUser);
  };

  const signUp = async (email: string, password: string, name: string, phone?: string): Promise<void> => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password || !trimmedName) {
      throw new Error("Email, password, and name are required");
    }
    const { token, user: apiUser } = await api.auth.register({
      email: trimmedEmail,
      password,
      name: trimmedName,
      phone: phone?.trim(),
    });
    await saveToken(token);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(apiUser));
    setUser(apiUser);
  };

  const signOut = async (): Promise<void> => {
    try {
      await clearToken();
      await AsyncStorage.removeItem(USER_CACHE_KEY);
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) throw new Error("Not authenticated");
    const { user: updated } = await api.auth.updateProfile(updates);
    setUser(updated);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    try {
      const { user: updated } = await api.auth.me();
      setUser(updated);
      await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
    } catch {
      // ignore refresh errors silently
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
