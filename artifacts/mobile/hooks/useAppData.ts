import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/apiClient";
import { Category, Provider, Service } from "@/types";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    staleTime: 10 * 60 * 1000,
    queryFn: () => api.categories.list(),
  });
}

export function useServices(categoryId?: string, search?: string) {
  return useQuery<Service[]>({
    queryKey: ["services", categoryId, search],
    staleTime: 5 * 60 * 1000,
    queryFn: () => api.services.list({ categoryId, search }),
  });
}

export function useService(id: string) {
  return useQuery<Service | undefined>({
    queryKey: ["service", id],
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(id),
    queryFn: async () => {
      try {
        return await api.services.get(id);
      } catch {
        return undefined;
      }
    },
  });
}

export function useProviders(categoryName?: string) {
  return useQuery<Provider[]>({
    queryKey: ["providers", categoryName],
    staleTime: 5 * 60 * 1000,
    queryFn: () => api.providers.list(categoryName),
  });
}
