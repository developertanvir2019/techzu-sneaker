import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import type { AppDispatch } from "../app/store";
import { updateStock, addPurchaser } from "../features/drops/dropsSlice";
import { api } from "../services/api";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? "http://localhost:3001";

export const useSocket = (currentUserId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    });

    socketRef.current = socket;

    // ─── stock:update ──────────────────────────────────────────────────────────
    // Fired on: create-reservation, reservation-expired, purchase-confirmed
    // Updates the Redux stockMap so ALL tabs see instant stock changes
    socket.on(
      "stock:update",
      (data: { id: string; availableStock: number }) => {
        dispatch(
          updateStock({ id: data.id, availableStock: data.availableStock })
        );
      }
    );

    // ─── reservation:expired ───────────────────────────────────────────────────
    // Stock is restored by the BullMQ worker → socket broadcasts
    // stock:update already fired; here we handle personal notification + cache
    socket.on(
      "reservation:expired",
      (data: {
        reservationId: string;
        dropId: string;
        userId: string;
        availableStock: number;
      }) => {
        // All clients: refresh the Drops RTK cache to sync full drop object
        dispatch(api.util.invalidateTags(["Drops"]));

        // Personal notification for the user whose reservation expired
        if (currentUserId && data.userId === currentUserId) {
          toast.warning("⏰ Your reservation expired!", {
            description:
              "You didn't complete the purchase in time. The item is back in the pool.",
            duration: 6000,
          });
          // Reset this user's reservation button
          dispatch(
            api.util.invalidateTags([
              { type: "Reservation", id: `${data.userId}-${data.dropId}` },
            ])
          );
        }
      }
    );

    // ─── purchase:confirmed ────────────────────────────────────────────────────
    // Fired after a successful purchase — stock permanently deducted
    socket.on(
      "purchase:confirmed",
      (data: {
        dropId: string;
        userId: string;
        username: string;
        availableStock: number;
      }) => {
        // 1. Update live stock in Redux (instant for all tabs)
        dispatch(
          updateStock({ id: data.dropId, availableStock: data.availableStock })
        );
        // 2. Prepend buyer to activity feed in Redux (optimistic)
        dispatch(
          addPurchaser({ dropId: data.dropId, username: data.username })
        );
        // 3. Invalidate Drops cache so all clients get fresh activity feed from API
        dispatch(api.util.invalidateTags(["Drops"]));

        // Personal success toast
        if (currentUserId && data.userId === currentUserId) {
          toast.success("🎉 Purchase confirmed!", {
            description: `You just copped a pair! Stock remaining: ${data.availableStock}`,
            duration: 6000,
          });
        } else {
          // Notify other clients about the new purchase
          toast.info(`🛒 ${data.username} just purchased!`, {
            description: `Only ${data.availableStock} left in stock.`,
            duration: 3000,
          });
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [dispatch, currentUserId]);
};
