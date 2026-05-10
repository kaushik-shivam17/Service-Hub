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
        if (!token) { setLoading(false); return; }
        // Try to restore from cache first for instant UI
        const cached = await AsyncStorage.getItem(USER_CACHE_KEY);
        if (cached) setUser(JSON.parse(cached));
        // Then verify with server
        const { user: serverUser } = await api.auth.me();
        setUser(serverUser);
        await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(serverUser));
      } catch {
        // Token invalid/expired — clear it
        await clearToken();
        await AsyncStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { token, user: apiUser } = await api.auth.login(email, password);
    await saveToken(token);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(apiUser));
    setUser(apiUser);
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    const { token, user: apiUser } = await api.auth.register({ email, password, name, phone });
    await saveToken(token);
    await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(apiUser));
    setUser(apiUser);
  };

  const signOut = async () => {
    await clearToken();
    await AsyncStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
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
