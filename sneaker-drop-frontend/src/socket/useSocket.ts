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
    });

    socketRef.current = socket;

    // ─── stock:update ──────────────────────────────────────────────────────────
    socket.on(
      "stock:update",
      (data: { id: string; availableStock: number }) => {
        dispatch(updateStock({ id: data.id, availableStock: data.availableStock }));
      }
    );

    // ─── reservation:expired ───────────────────────────────────────────────────
    socket.on(
      "reservation:expired",
      (data: {
        reservationId: string;
        dropId: string;
        userId: string;
        availableStock: number;
      }) => {
        dispatch(updateStock({ id: data.dropId, availableStock: data.availableStock }));

        // Notify the affected user personally
        if (data.userId === currentUserId) {
          toast.warning("⏰ Your reservation has expired!", {
            description: "The item has been returned to the pool.",
            duration: 5000,
          });
          // Invalidate reservation cache so the button resets
          dispatch(
            api.util.invalidateTags([
              { type: "Reservation", id: `${data.userId}-${data.dropId}` },
            ])
          );
        }
      }
    );

    // ─── purchase:confirmed ────────────────────────────────────────────────────
    socket.on(
      "purchase:confirmed",
      (data: {
        dropId: string;
        userId: string;
        username: string;
        availableStock: number;
      }) => {
        dispatch(updateStock({ id: data.dropId, availableStock: data.availableStock }));
        dispatch(addPurchaser({ dropId: data.dropId, username: data.username }));

        if (data.userId === currentUserId) {
          toast.success("🎉 Purchase confirmed!", {
            description: `You just copped a pair! Stock remaining: ${data.availableStock}`,
            duration: 6000,
          });
        }
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [dispatch, currentUserId]);
};
