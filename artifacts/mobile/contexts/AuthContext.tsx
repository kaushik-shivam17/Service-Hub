import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { UserProfile } from "@/types";

const MOCK_USER_KEY = "@urban_mock_user";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
            phone: session.user.user_metadata?.phone,
          });
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? "",
            name: session.user.user_metadata?.name ?? session.user.email?.split("@")[0] ?? "User",
            phone: session.user.user_metadata?.phone,
          });
        } else {
          setUser(null);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      AsyncStorage.getItem(MOCK_USER_KEY).then((stored) => {
        if (stored) setUser(JSON.parse(stored));
        setLoading(false);
      });
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    } else {
      const mockUser: UserProfile = {
        id: "mock_" + Date.now(),
        email,
        name: email.split("@")[0],
      };
      await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone } },
      });
      if (error) throw new Error(error.message);
    } else {
      const mockUser: UserProfile = {
        id: "mock_" + Date.now(),
        email,
        name,
        phone,
      };
      await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      await AsyncStorage.removeItem(MOCK_USER_KEY);
      setUser(null);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.updateUser({ data: updates });
    } else {
      await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
    }
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
