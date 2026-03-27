import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { usePurchaseItemMutation } from "../services/api";
import toast from "react-hot-toast";
import { ShoppingBag } from "lucide-react";

interface Props {
  dropId: string;
  hasActiveReservation: boolean;
  onSuccess?: () => void;
}

export const PurchaseButton = ({
  dropId,
  hasActiveReservation,
  onSuccess,
}: Props) => {
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  const [purchaseItem, { isLoading }] = usePurchaseItemMutation();

  const handlePurchase = async () => {
    if (!currentUser) {
      toast.error("Please select a user first!");
      return;
    }

    try {
      await purchaseItem({ userId: currentUser.id, dropId }).unwrap();
      toast.success("🎉 Purchase complete! Sneakers are yours!", {
        duration: 6000,
      });
      onSuccess?.();
    } catch (err: unknown) {
      const msg =
        (err as { data?: { error?: string } })?.data?.error ||
        "Purchase failed";
      toast.error(`❌ ${msg}`);
    }
  };

  if (!hasActiveReservation) return null;

  return (
    <button
      id={`purchase-${dropId}`}
      onClick={handlePurchase}
      disabled={isLoading}
      className={`purchase-btn ${isLoading ? "loading" : ""}`}
    >
      {isLoading ? (
        <span className="btn-spinner" />
      ) : (
        <ShoppingBag size={16} />
      )}
      {isLoading ? "Processing..." : "Complete Purchase"}
    </button>
  );
};
