import AsyncStorage from "@react-native-async-storage/async-storage";

import { Booking, Category, Provider, Service, UserProfile } from "@/types";

const TOKEN_KEY = "@urban_jwt_token";

function getApiBase(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}/api`;
  return "http://localhost:8080/api";
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });

  if (!response.ok) {
    let errMsg = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) errMsg = body.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

interface AuthResponse {
  token: string;
  user: UserProfile;
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; phone?: string }) =>
      request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    login: (email: string, password: string) =>
      request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
    me: () => request<{ user: UserProfile }>("/auth/me"),
    updateProfile: (data: Partial<UserProfile>) =>
      request<{ user: UserProfile }>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),
  },

  categories: {
    list: () => request<Category[]>("/categories"),
  },

  services: {
    list: (params?: { categoryId?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.categoryId && params.categoryId !== "all") q.set("categoryId", params.categoryId);
      if (params?.search?.trim()) q.set("search", params.search.trim());
      const qs = q.toString();
      return request<Service[]>(`/services${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Service>(`/services/${encodeURIComponent(id)}`),
  },

  providers: {
    list: (categoryName?: string) => {
      const qs = categoryName ? `?categoryName=${encodeURIComponent(categoryName)}` : "";
      return request<Provider[]>(`/providers${qs}`);
    },
  },

  bookings: {
    list: () => request<Booking[]>("/bookings"),
    create: (booking: Booking) =>
      request<Booking>("/bookings", { method: "POST", body: JSON.stringify(booking) }),
    cancel: (id: string) =>
      request<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, { method: "PATCH" }),
  },
};
