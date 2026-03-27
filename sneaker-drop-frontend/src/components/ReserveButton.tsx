import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { Loader2, Lock, ShoppingCart, BookmarkPlus } from "lucide-react";
import { cn } from "../lib/utils";
import type { RootState } from "../app/store";
import {
  useCheckReservationQuery,
  useCreateReservationMutation,
  useCompletePurchaseMutation,
  type Reservation,
} from "../services/api";
import { CountdownTimer } from "./CountdownTimer";

interface ReservePurchaseButtonProps {
  dropId: string;
  availableStock: number;
}

export const ReservePurchaseButton = ({
  dropId,
  availableStock,
}: ReservePurchaseButtonProps) => {
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  const [localExpired, setLocalExpired] = useState(false);

  // Check for existing active reservation
  const {
    data: activeReservation,
    isLoading: checking,
    refetch: refetchReservation,
  } = useCheckReservationQuery(
    { userId: currentUser?.id ?? "", dropId },
    { skip: !currentUser }
  );

  const [createReservation, { isLoading: reserving }] =
    useCreateReservationMutation();
  const [completePurchase, { isLoading: purchasing }] =
    useCompletePurchaseMutation();

  // Reset local expired state when reservation changes
  useEffect(() => {
    if (activeReservation?.status === "ACTIVE") {
      setLocalExpired(false);
    }
  }, [activeReservation]);

  // No user selected
  if (!currentUser) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/40 text-slate-500 text-sm font-medium cursor-not-allowed"
      >
        <Lock size={14} />
        Select user to reserve
      </button>
    );
  }

  if (checking) {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 text-slate-500 text-sm">
        <Loader2 size={14} className="animate-spin" />
        Checking reservation…
      </div>
    );
  }

  const hasActive =
    activeReservation?.status === "ACTIVE" && !localExpired;

  // ─── RESERVE ──────────────────────────────────────────────────────────────
  const handleReserve = async () => {
    if (!currentUser) return;
    try {
      await createReservation({ userId: currentUser.id, dropId }).unwrap();
      toast.success("✅ Reserved!", {
        description: "You have 60 seconds to complete your purchase.",
      });
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object" &&
        "error" in err.data
          ? String((err.data as { error: string }).error)
          : "Could not reserve item. Try again.";
      toast.error("⚠️ " + msg, { duration: 5000 });
    }
  };

  // ─── PURCHASE ─────────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (!currentUser) return;
    try {
      await completePurchase({ userId: currentUser.id, dropId }).unwrap();
      toast.success("🎉 Purchase complete!", {
        description: "Your sneakers are on the way!",
      });
    } catch (err: unknown) {
      const msg =
        err &&
        typeof err === "object" &&
        "data" in err &&
        err.data &&
        typeof err.data === "object" &&
        "error" in err.data
          ? String((err.data as { error: string }).error)
          : "Purchase failed. Try again.";
      toast.error("⚠️ " + msg, { duration: 5000 });
    }
  };

  if (hasActive && activeReservation) {
    return (
      <div className="flex flex-col gap-2">
        <CountdownTimer
          expiresAt={activeReservation.expiresAt}
          onExpire={() => {
            setLocalExpired(true);
            void refetchReservation();
          }}
        />
        <button
          onClick={handlePurchase}
          disabled={purchasing}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
            "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500",
            "text-white shadow-lg shadow-violet-900/30 hover:shadow-violet-800/40",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {purchasing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ShoppingCart size={16} />
          )}
          {purchasing ? "Processing…" : "Complete Purchase"}
        </button>
      </div>
    );
  }

  const outOfStock = availableStock <= 0;

  return (
    <button
      onClick={handleReserve}
      disabled={reserving || outOfStock}
      className={cn(
        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all",
        outOfStock
          ? "bg-slate-700/40 text-slate-500 cursor-not-allowed"
          : "bg-slate-700 hover:bg-slate-600 text-white cursor-pointer hover:ring-2 hover:ring-violet-500/40",
        "disabled:opacity-60 disabled:cursor-not-allowed"
      )}
    >
      {reserving ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <BookmarkPlus size={16} />
      )}
      {reserving ? "Reserving…" : outOfStock ? "Sold Out" : "Reserve"}
    </button>
  );
};

// Compatibility alias
export const ReserveButton = ReservePurchaseButton;
