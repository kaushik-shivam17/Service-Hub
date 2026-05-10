import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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

async function fetchProfile(id: string): Promise<Partial<UserProfile>> {
  if (!supabase) return {};
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  if (!data) return {};
  return { name: data.name, phone: data.phone };
}

async function upsertProfile(profile: UserProfile): Promise<void> {
  if (!supabase) return;
  await supabase.from("profiles").upsert({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    phone: profile.phone ?? null,
    updated_at: new Date().toISOString(),
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async (id: string, email: string, metaName?: string) => {
    let name = metaName ?? email.split("@")[0];
    let phone: string | undefined;
    if (isSupabaseConfigured && supabase) {
      const extra = await fetchProfile(id);
      if (extra.name) name = extra.name;
      if (extra.phone) phone = extra.phone;
    }
    return { id, email, name, phone };
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const updated = await loadUser(user.id, user.email, user.name);
    setUser(updated);
  }, [user, loadUser]);

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const u = await loadUser(
            session.user.id,
            session.user.email ?? "",
            session.user.user_metadata?.name
          );
          setUser(u);
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const u = await loadUser(
            session.user.id,
            session.user.email ?? "",
            session.user.user_metadata?.name
          );
          setUser(u);
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
  }, [loadUser]);

  const signIn = async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error("Invalid email or password. Please try again.");
    } else {
      const stored = await AsyncStorage.getItem(MOCK_USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
        return;
      }
      const mockId = `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const mockUser: UserProfile = { id: mockId, email, name: email.split("@")[0] };
      await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone?: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, phone: phone ?? null } },
      });
      if (error) throw new Error("Registration failed. Please try again.");
    } else {
      const mockId = `mock_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const mockUser: UserProfile = { id: mockId, email, name, phone };
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
      await supabase.auth.updateUser({ data: { name: updates.name, phone: updates.phone } });
      await upsertProfile(updated);
    } else {
      await AsyncStorage.setItem(MOCK_USER_KEY, JSON.stringify(updated));
    }
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
