import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { useReserveItemMutation } from "../services/api";
import toast from "react-hot-toast";
import { Zap } from "lucide-react";

interface Props {
  dropId: string;
  availableStock: number;
  hasActiveReservation: boolean;
}

export const ReserveButton = ({
  dropId,
  availableStock,
  hasActiveReservation,
}: Props) => {
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  const [reserveItem, { isLoading }] = useReserveItemMutation();

  const handleReserve = async () => {
    if (!currentUser) {
      toast.error("Please select a user first!");
      return;
    }

    try {
      await reserveItem({ userId: currentUser.id, dropId }).unwrap();
      toast.success("✅ Reserved! You have 60 seconds to complete purchase.", {
        duration: 5000,
      });
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ||
        "Failed to reserve";
      toast.error(`❌ ${msg}`);
    }
  };

  const isDisabled = availableStock <= 0 || hasActiveReservation || isLoading || !currentUser;

  return (
    <button
      id={`reserve-${dropId}`}
      onClick={handleReserve}
      disabled={isDisabled}
      className={`reserve-btn ${isDisabled ? "disabled" : "active"}`}
    >
      {isLoading ? (
        <span className="btn-spinner" />
      ) : (
        <Zap size={16} />
      )}
      {isLoading
        ? "Reserving..."
        : hasActiveReservation
        ? "Already Reserved"
        : availableStock <= 0
        ? "Sold Out"
        : "Reserve Now"}
    </button>
  );
};
