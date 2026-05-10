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
