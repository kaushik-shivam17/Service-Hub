import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/apiClient";
import { Booking } from "@/types";

export function useBookings(userId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["bookings", userId];

  const query = useQuery<Booking[]>({
    queryKey,
    enabled: Boolean(userId),
    staleTime: 30 * 1000,
    retry: 2,
    queryFn: () => api.bookings.list(),
  });

  const createBooking = useMutation({
    mutationFn: async ({ booking }: { booking: Booking; userId: string }) => {
      return api.bookings.create(booking);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bookings"] }),
  });

  const cancelBooking = useMutation({
    mutationFn: async (bookingId: string) => {
      return api.bookings.cancel(bookingId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, createBooking, cancelBooking };
}

export function useBooking(bookingId: string | undefined) {
  return useQuery<Booking>({
    queryKey: ["booking", bookingId],
    enabled: Boolean(bookingId),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    retry: 2,
    queryFn: () => api.bookings.get(bookingId!),
  });
}

export function useWorkerBookings() {
  const queryClient = useQueryClient();
  const queryKey = ["worker-bookings"];

  const query = useQuery<Booking[]>({
    queryKey,
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
    retry: 2,
    queryFn: () => api.worker.bookings(),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.worker.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });

  return { ...query, updateStatus };
}
