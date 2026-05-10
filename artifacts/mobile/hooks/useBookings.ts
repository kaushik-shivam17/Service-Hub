import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BOOKINGS_KEY } from "@/data/mockData";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Booking } from "@/types";

function mapDbRow(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    serviceId: (row.service_id as string) ?? "",
    serviceName: row.service_name as string,
    categoryName: row.category_name as string,
    providerId: row.provider_id as string | undefined,
    providerName: row.provider_name as string | undefined,
    date: row.date as string,
    time: row.time as string,
    address: row.address as string,
    status: row.status as Booking["status"],
    totalPrice: row.total_price as number,
    createdAt: row.created_at as string,
  };
}

function mapToDb(booking: Booking, userId: string): Record<string, unknown> {
  return {
    id: booking.id,
    user_id: userId,
    service_id: booking.serviceId || null,
    service_name: booking.serviceName,
    category_name: booking.categoryName,
    provider_id: booking.providerId ?? null,
    provider_name: booking.providerName ?? null,
    date: booking.date,
    time: booking.time,
    address: booking.address,
    status: booking.status,
    total_price: booking.totalPrice,
    created_at: booking.createdAt,
  };
}

export function useBookings(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["bookings", userId];

  const query = useQuery<Booking[]>({
    queryKey,
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    retry: 2,
    queryFn: async () => {
      if (isSupabaseConfigured && supabase && userId) {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        return data.map(mapDbRow);
      }
      const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
      return raw ? (JSON.parse(raw) as Booking[]) : [];
    },
  });

  const createBooking = useMutation({
    mutationFn: async ({ booking, userId: uid }: { booking: Booking; userId: string }) => {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from("bookings").insert(mapToDb(booking, uid));
        if (error) throw new Error(error.message);
      } else {
        const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
        const existing: Booking[] = raw ? JSON.parse(raw) : [];
        existing.unshift(booking);
        await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(existing));
      }
      return booking;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      if (isSupabaseConfigured && supabase && userId) {
        const { error } = await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId)
          .eq("user_id", userId);
        if (error) throw new Error(error.message);
      } else {
        const raw = await AsyncStorage.getItem(BOOKINGS_KEY);
        const existing: Booking[] = raw ? JSON.parse(raw) : [];
        const updated = existing.map((b) =>
          b.id === bookingId ? { ...b, status: "cancelled" as const } : b
        );
        await AsyncStorage.setItem(BOOKINGS_KEY, JSON.stringify(updated));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, createBooking, cancelBooking };
}
