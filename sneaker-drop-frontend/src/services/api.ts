import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface Purchaser {
  username: string;
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
    // Drops
    getDrops: builder.query<Drop[], void>({
      query: () => "/drops",
      transformResponse: (res: { success: boolean; data: Drop[] }) => res.data,
      providesTags: ["Drops"],
    }),

    // Users
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      transformResponse: (res: { success: boolean; data: User[] }) => res.data,
    }),

    // Check reservation
    checkReservation: builder.query<
      Reservation | null,
      { userId: string; dropId: string }
    >({
      query: ({ userId, dropId }) =>
        `/reservations/check?userId=${userId}&dropId=${dropId}`,
      transformResponse: (res: {
        success: boolean;
        data: Reservation | null;
      }) => res.data,
      providesTags: (_result, _err, arg) => [
        { type: "Reservation", id: `${arg.userId}-${arg.dropId}` },
      ],
    }),

    // Create reservation
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
      invalidatesTags: (_result, _err, arg) => [
        { type: "Reservation", id: `${arg.userId}-${arg.dropId}` },
      ],
    }),

    // Complete purchase
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
