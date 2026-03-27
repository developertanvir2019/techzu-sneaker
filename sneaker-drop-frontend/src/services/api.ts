import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface Purchaser {
  purchaseId: string;
  userId: string;
  username: string;
  purchasedAt: string;
}

export interface Drop {
  id: string;
  name: string;
  price: number;
  totalStock: number;
  availableStock: number;
  startTime: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  colorway?: string;
  createdAt: string;
  recentPurchasers: Purchaser[];
}

export interface Reservation {
  id: string;
  userId: string;
  dropId: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "COMPLETED";
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: `${BASE_URL}/api` }),
  tagTypes: ["Drops", "Users", "Reservations"],
  endpoints: (builder) => ({
    // ─── Users ─────────────────────────────────────────────────────────────
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      transformResponse: (res: ApiResponse<User[]>) => res.data,
      providesTags: ["Users"],
    }),

    // ─── Drops ─────────────────────────────────────────────────────────────
    getDrops: builder.query<Drop[], void>({
      query: () => "/drops",
      transformResponse: (res: ApiResponse<Drop[]>) => res.data,
      providesTags: ["Drops"],
    }),

    createDrop: builder.mutation<
      Drop,
      Partial<Drop> & { totalStock: number; startTime: string }
    >({
      query: (body) => ({ url: "/drops", method: "POST", body }),
      transformResponse: (res: ApiResponse<Drop>) => res.data,
      invalidatesTags: ["Drops"],
    }),

    // ─── Reservations ───────────────────────────────────────────────────────
    reserveItem: builder.mutation<
      Reservation,
      { userId: string; dropId: string }
    >({
      query: (body) => ({ url: "/reservations", method: "POST", body }),
      transformResponse: (res: ApiResponse<Reservation>) => res.data,
      invalidatesTags: ["Drops"],
    }),

    checkReservation: builder.query<
      Reservation | null,
      { userId: string; dropId: string }
    >({
      query: ({ userId, dropId }) =>
        `/reservations/check?userId=${userId}&dropId=${dropId}`,
      transformResponse: (res: ApiResponse<Reservation | null>) => res.data,
      providesTags: ["Reservations"],
    }),

    // ─── Purchases ──────────────────────────────────────────────────────────
    purchaseItem: builder.mutation<
      { id: string },
      { userId: string; dropId: string }
    >({
      query: (body) => ({ url: "/purchases", method: "POST", body }),
      transformResponse: (res: ApiResponse<{ id: string }>) => res.data,
      invalidatesTags: ["Drops", "Reservations"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetDropsQuery,
  useCreateDropMutation,
  useReserveItemMutation,
  useCheckReservationQuery,
  usePurchaseItemMutation,
} = apiSlice;
