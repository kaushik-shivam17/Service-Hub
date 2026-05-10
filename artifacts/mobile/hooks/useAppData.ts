import { useQuery } from "@tanstack/react-query";

import {
  categories as mockCategories,
  providers as mockProviders,
  services as mockServices,
} from "@/data/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Category, Provider, Service } from "@/types";

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    iconLibrary: (row.icon_library as Category["iconLibrary"]) ?? "Feather",
    color: row.color as string,
    bgColor: row.bg_color as string,
  };
}

function mapService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    categoryId: row.category_id as string,
    categoryName: row.category_name as string,
    name: row.name as string,
    description: row.description as string,
    price: row.price as number,
    duration: row.duration as number,
    rating: Number(row.rating),
    reviewCount: row.review_count as number,
    popular: row.popular as boolean,
    includes: (row.includes as string[]) ?? [],
  };
}

function mapProvider(row: Record<string, unknown>): Provider {
  return {
    id: row.id as string,
    name: row.name as string,
    rating: Number(row.rating),
    reviewCount: row.review_count as number,
    experienceYears: row.experience_years as number,
    specializations: (row.specializations as string[]) ?? [],
    pricePerHour: row.price_per_hour as number,
    verified: row.verified as boolean,
    completedJobs: row.completed_jobs as number,
    initials: row.initials as string,
    color: row.color as string,
  };
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");
        if (error) throw new Error(error.message);
        return data.map(mapCategory);
      }
      return mockCategories;
    },
  });
}

export function useServices(categoryId?: string, search?: string) {
  return useQuery<Service[]>({
    queryKey: ["services", categoryId, search],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        let q = supabase.from("services").select("*");
        if (categoryId && categoryId !== "all") q = q.eq("category_id", categoryId);
        if (search?.trim()) q = q.ilike("name", `%${search.trim()}%`);
        const { data, error } = await q.order("popular", { ascending: false }).order("rating", { ascending: false });
        if (error) throw new Error(error.message);
        return data.map(mapService);
      }
      let result = mockServices;
      if (categoryId && categoryId !== "all") result = result.filter((s) => s.categoryId === categoryId);
      if (search?.trim()) result = result.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
      return result;
    },
  });
}

export function useService(id: string) {
  return useQuery<Service | undefined>({
    queryKey: ["service", id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase.from("services").select("*").eq("id", id).single();
        if (error) throw new Error(error.message);
        return mapService(data);
      }
      return mockServices.find((s) => s.id === id);
    },
  });
}

export function useProviders(categoryName?: string) {
  return useQuery<Provider[]>({
    queryKey: ["providers", categoryName],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("providers")
          .select("*")
          .order("rating", { ascending: false });
        if (error) throw new Error(error.message);
        const all = data.map(mapProvider);
        if (categoryName) {
          const filtered = all.filter((p) =>
            p.specializations.some(
              (s) => s.toLowerCase().includes(categoryName.toLowerCase()) ||
                categoryName.toLowerCase().includes(s.toLowerCase())
            )
          );
          return filtered.length > 0 ? filtered : all.slice(0, 4);
        }
        return all;
      }
      const all = mockProviders;
      if (categoryName) {
        const filtered = all.filter((p) =>
          p.specializations.some(
            (s) => s.toLowerCase().includes(categoryName.toLowerCase()) ||
              categoryName.toLowerCase().includes(s.toLowerCase())
          )
        );
        return filtered.length > 0 ? filtered : all.slice(0, 4);
      }
      return all;
    },
  });
}
