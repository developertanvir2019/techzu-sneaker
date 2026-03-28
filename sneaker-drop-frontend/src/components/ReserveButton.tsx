import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { Loader2, Lock, ShoppingCart, BookmarkPlus } from "lucide-react";
import { cn } from "../lib/utils";
import type { RootState, AppDispatch } from "../app/store";
import {
  useCheckReservationQuery,
  useCreateReservationMutation,
  useCompletePurchaseMutation,
  api,
} from "../services/api";
import { CountdownTimer } from "./CountdownTimer";

interface ReservePurchaseButtonProps {
  dropId: string;
  availableStock: number;
}

// Helper to extract error message from RTK Query error
const extractError = (err: unknown, fallback: string): string => {
  if (
    err &&
    typeof err === "object" &&
    "data" in err &&
    err.data &&
    typeof err.data === "object" &&
    "error" in err.data
  ) {
    return String((err.data as { error: string }).error);
  }
  return fallback;
};

export const ReservePurchaseButton = ({
  dropId,
  availableStock,
}: ReservePurchaseButtonProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  // Track if the countdown expired locally (before socket fires)
  const [localExpired, setLocalExpired] = useState(false);

  // Always re-check on mount so state is fresh after page reload or user switch
  const {
    data: activeReservation,
    isLoading: checking,
    refetch: refetchReservation,
  } = useCheckReservationQuery(
    { userId: currentUser?.id ?? "", dropId },
    {
      skip: !currentUser,
      // Re-check whenever the component mounts (user could have an existing reservation)
      refetchOnMountOrArgChange: true,
    }
  );

  const [createReservation, { isLoading: reserving }] =
    useCreateReservationMutation();
  const [completePurchase, { isLoading: purchasing }] =
    useCompletePurchaseMutation();

  // When a new active reservation arrives from the server, clear local expired flag
  useEffect(() => {
    if (activeReservation?.status === "ACTIVE") {
      setLocalExpired(false);
    }
  }, [activeReservation]);

  // ── No user selected ──────────────────────────────────────────────────────
  if (!currentUser) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800/60 text-slate-500 text-sm font-medium cursor-not-allowed border border-slate-700/40"
      >
        <Lock size={14} />
        Select user to reserve
      </button>
    );
  }

  // ── Checking reservation state ────────────────────────────────────────────
  if (checking) {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800/60 text-slate-500 text-sm">
        <Loader2 size={14} className="animate-spin" />
        <span>Checking reservation…</span>
      </div>
    );
  }

  const hasActiveReservation =
    activeReservation?.status === "ACTIVE" && !localExpired;

  // ── RESERVE ───────────────────────────────────────────────────────────────
  const handleReserve = async () => {
    if (!currentUser) return;
    try {
      await createReservation({ userId: currentUser.id, dropId }).unwrap();
      toast.success("✅ Item Reserved!", {
        description:
          "You have 60 seconds to complete your purchase before it expires.",
      });
    } catch (err: unknown) {
      toast.error(
        "⚠️ " + extractError(err, "Could not reserve item. Try again."),
        { duration: 5000 }
      );
    }
  };

  // ── PURCHASE ──────────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!currentUser) return;
    try {
      await completePurchase({ userId: currentUser.id, dropId }).unwrap();
      // Toast handled by socket hook for the purchaser
    } catch (err: unknown) {
      const msg = extractError(
        err,
        "Purchase failed. Your reservation may have expired."
      );
      toast.error("⚠️ " + msg, { duration: 5000 });
    }
  };

  // ── Active reservation: show countdown + purchase button ──────────────────
  if (hasActiveReservation && activeReservation) {
    return (
      <div className="flex flex-col gap-2">
        <CountdownTimer
          expiresAt={activeReservation.expiresAt}
          onExpire={() => {
            setLocalExpired(true);
            // Fallback: if socket event was missed, force API refetch to restore stock in UI.
            // The socket reservation:expired handler does this too, but we guard here as well.
            dispatch(api.util.invalidateTags(["Drops"]));
            dispatch(
              api.util.invalidateTags([
                {
                  type: "Reservation" as const,
                  id: `${currentUser?.id}-${dropId}`,
                },
              ])
            );
            void refetchReservation();
          }}
        />
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            "bg-gradient-to-r from-violet-600 to-fuchsia-600",
            "hover:from-violet-500 hover:to-fuchsia-500",
            "text-white shadow-lg shadow-violet-900/30",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {purchasing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <ShoppingCart size={16} />
              Complete Purchase
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Default: Reserve button (or Sold Out state) ───────────────────────────
  const outOfStock = availableStock <= 0;

  return (
    <button
      onClick={handleReserve}
      disabled={reserving || outOfStock}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
        outOfStock
          ? "bg-red-950/50 text-red-400/60 cursor-not-allowed border border-red-900/30"
          : [
              "bg-slate-700 hover:bg-slate-600 text-white",
              "hover:ring-2 hover:ring-violet-500/50",
              "active:scale-[0.98]",
            ],
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
    >
      {reserving ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Reserving…
        </>
      ) : (
        <>
          <BookmarkPlus size={16} />
          {outOfStock ? "Sold Out" : "Reserve"}
        </>
      )}
    </button>
  );
};

// Alias
export const ReserveButton = ReservePurchaseButton;
