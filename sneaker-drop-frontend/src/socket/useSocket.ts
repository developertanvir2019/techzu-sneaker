import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../app/store";
import { updateStock } from "../features/drops/dropsSlice";
import { apiSlice } from "../services/api";
import toast from "react-hot-toast";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface StockUpdatePayload {
  id: string;
  availableStock: number;
  [key: string]: unknown;
}

interface ReservationExpiredPayload {
  reservationId: string;
  dropId: string;
  userId: string;
  availableStock: number;
}

interface PurchaseConfirmedPayload {
  dropId: string;
  userId: string;
  username: string;
  availableStock: number;
}

export const useSocket = (currentUserId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("🔌 Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
    });

    // ─── Real-time stock update ───────────────────────────────────────────
    socket.on("stock:update", (data: StockUpdatePayload) => {
      dispatch(updateStock({ id: data.id, availableStock: data.availableStock } as Parameters<typeof updateStock>[0]));
      // Invalidate cache so purchasers list refreshes
      dispatch(apiSlice.util.invalidateTags(["Drops"]));
    });

    // ─── Reservation expired ─────────────────────────────────────────────
    socket.on("reservation:expired", (data: ReservationExpiredPayload) => {
      dispatch(updateStock({ id: data.dropId, availableStock: data.availableStock } as Parameters<typeof updateStock>[0]));
      dispatch(apiSlice.util.invalidateTags(["Reservations", "Drops"]));

      if (currentUserId && data.userId === currentUserId) {
        toast.error("⏱️ Your reservation expired! Stock returned.", {
          duration: 5000,
          id: `expired-${data.reservationId}`,
        });
      } else {
        toast("🔓 A reservation expired — 1 unit back in stock!", {
          duration: 3000,
          icon: "📦",
        });
      }
    });

    // ─── Purchase confirmed ──────────────────────────────────────────────
    socket.on("purchase:confirmed", (data: PurchaseConfirmedPayload) => {
      dispatch(apiSlice.util.invalidateTags(["Drops"]));
      if (currentUserId && data.userId !== currentUserId) {
        toast(`🛍️ ${data.username} just bought a pair!`, {
          duration: 3000,
          icon: "🔥",
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, dispatch]);

  return socketRef.current;
};
