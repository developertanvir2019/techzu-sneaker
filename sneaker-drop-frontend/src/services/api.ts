import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

// Matches backend: { purchaseId, userId, username, purchasedAt }
export interface Purchaser {
  purchaseId?: string;
  userId?: string;
  username: string;
  purchasedAt?: string;
}

export interface Drop {
  id: string;
  name: string;
  brand?: string;
  colorway?: string;
  price: number;
  totalStock: number;
  availableStock: number;
  startTime: string;
  imageUrl?: string;
  description?: string;
  createdAt: string;
  recentPurchasers: Purchaser[];
}

export interface Reservation {
  id: string;
  userId: string;
  dropId: string;
  status: "ACTIVE" | "EXPIRED" | "COMPLETED";
  expiresAt: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  dropId: string;
  createdAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api` }),
  tagTypes: ["Drops", "Reservation"],
  endpoints: (builder) => ({
    // ── Drops ─────────────────────────────────────────────────────────────────
    getDrops: builder.query<Drop[], void>({
      query: () => "/drops",
      transformResponse: (res: { success: boolean; data: Drop[] }) => res.data,
      providesTags: ["Drops"],
      // Polls every 30s as WebSocket fallback
      keepUnusedDataFor: 60,
    }),

    // ── Users ─────────────────────────────────────────────────────────────────
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      transformResponse: (res: { success: boolean; data: User[] }) => res.data,
    }),

    // ── Check active reservation ───────────────────────────────────────────────
    checkReservation: builder.query<
      Reservation | null,
      { userId: string; dropId: string }
    >({
      query: ({ userId, dropId }) =>
        `/reservations/check?userId=${userId}&dropId=${dropId}`,
      // data can be null (no active reservation) — handle safely
      transformResponse: (res: {
        success: boolean;
        data: Reservation | null;
      }) => res.data ?? null,
      providesTags: (_result, _err, arg) => [
        { type: "Reservation", id: `${arg.userId}-${arg.dropId}` },
      ],
      // Always re-check on mount — reservation state changes externally (expiry worker)
      keepUnusedDataFor: 0,
    }),

    // ── Create reservation ─────────────────────────────────────────────────────
    createReservation: builder.mutation<
      Reservation,
      { userId: string; dropId: string }
    >({
      query: (body) => ({
        url: "/reservations",
        method: "POST",
        body,
      }),
      transformResponse: (res: { success: boolean; data: Reservation }) =>
        res.data,
      // Invalidate both: reservation state + drop list (for activity feed consistency)
      invalidatesTags: (_result, _err, arg) => [
        { type: "Reservation", id: `${arg.userId}-${arg.dropId}` },
      ],
    }),

    // ── Complete purchase ──────────────────────────────────────────────────────
    completePurchase: builder.mutation<
      Purchase,
      { userId: string; dropId: string }
    >({
      query: (body) => ({
        url: "/purchases",
        method: "POST",
        body,
      }),
      transformResponse: (res: { success: boolean; data: Purchase }) =>
        res.data,
      // Invalidate drops (activity feed refresh) + reservation (button reset)
      invalidatesTags: (_result, _err, arg) => [
        "Drops",
        { type: "Reservation", id: `${arg.userId}-${arg.dropId}` },
      ],
    }),
  }),
});

export const {
  useGetDropsQuery,
  useGetUsersQuery,
  useCheckReservationQuery,
  useCreateReservationMutation,
  useCompletePurchaseMutation,
} = api;
