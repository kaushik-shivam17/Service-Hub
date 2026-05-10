import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { api } from "@/lib/apiClient";
import { sendBookingStatusNotification, sendNewJobNotification } from "@/lib/notifications";
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
  const prevStatusRef = useRef<string | null>(null);
  const isFirstFetchRef = useRef(true);

  const query = useQuery<Booking>({
    queryKey: ["booking", bookingId],
    enabled: Boolean(bookingId),
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    retry: 2,
    queryFn: () => api.bookings.get(bookingId!),
  });

  useEffect(() => {
    if (!query.data) return;

    const currentStatus = query.data.status;

    if (isFirstFetchRef.current) {
      prevStatusRef.current = currentStatus;
      isFirstFetchRef.current = false;
      return;
    }

    if (prevStatusRef.current !== null && prevStatusRef.current !== currentStatus) {
      sendBookingStatusNotification(query.data.serviceName, currentStatus);
      prevStatusRef.current = currentStatus;
    }
  }, [query.data]);

  return query;
}

export function useWorkerBookings() {
  const queryClient = useQueryClient();
  const queryKey = ["worker-bookings"];
  const prevIdsRef = useRef<Set<string> | null>(null);

  const query = useQuery<Booking[]>({
    queryKey,
    staleTime: 15 * 1000,
    refetchInterval: 20 * 1000,
    retry: 2,
    queryFn: () => api.worker.bookings(),
  });

  useEffect(() => {
    if (!query.data) return;

    const currentIds = new Set(query.data.map((b) => b.id));

    if (prevIdsRef.current === null) {
      prevIdsRef.current = currentIds;
      return;
    }

    for (const booking of query.data) {
      if (!prevIdsRef.current.has(booking.id)) {
        sendNewJobNotification(booking.serviceName, booking.date, booking.time);
      }
    }

    prevIdsRef.current = currentIds;
  }, [query.data]);

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
