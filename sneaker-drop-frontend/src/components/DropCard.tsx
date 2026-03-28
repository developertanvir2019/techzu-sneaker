import { useSelector } from "react-redux";
import { Zap, Package, Tag, Info } from "lucide-react";
import { cn } from "../lib/utils";
import type { Drop } from "../services/api";
import type { RootState } from "../app/store";
import { ActivityFeed } from "./ActivityFeed";
import { ReservePurchaseButton } from "./ReserveButton";

interface DropCardProps {
  drop: Drop;
}

// Price is stored as integer cents (e.g. 180 = $1.80)
const formatPrice = (cents: number): string =>
  (cents / 100).toFixed(2);

export const DropCard = ({ drop }: DropCardProps) => {
  const stockMap = useSelector((s: RootState) => s.drops.stockMap);
  const purchasersMap = useSelector((s: RootState) => s.drops.purchasersMap);

  // Socket events keep stockMap up-to-date; fall back to API value on initial load
  const availableStock = stockMap[drop.id] ?? drop.availableStock;
  // Socket events prepend new buyers; fall back to API value
  const purchasers = purchasersMap[drop.id] ?? drop.recentPurchasers ?? [];

  const stockPct =
    drop.totalStock > 0 ? (availableStock / drop.totalStock) * 100 : 0;
  const isSoldOut = availableStock <= 0;
  const isLow = availableStock > 0 && availableStock <= 5;

  const stockColor = isSoldOut
    ? "text-red-400"
    : isLow
      ? "text-amber-400"
      : "text-emerald-400";

  const stockBarColor = isSoldOut
    ? "bg-red-500"
    : isLow
      ? "bg-amber-400"
      : "bg-emerald-400";

  return (
    <div className="relative flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 hover:shadow-violet-900/10 transition-all duration-300 group">
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* ── Image ── */}
      <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center overflow-hidden">
        {drop.imageUrl ? (
          <img
            src={drop.imageUrl}
            alt={drop.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-700">
            <Zap size={48} strokeWidth={1} />
          </div>
        )}

        {/* Sold Out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-base font-black text-red-400 tracking-[0.25em] uppercase border border-red-800/40 px-3 py-1 rounded-full bg-red-950/50">
              Sold Out
            </span>
          </div>
        )}

        {/* Brand badge */}
        {drop.brand && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-slate-900/80 text-violet-300 px-2.5 py-0.5 rounded-full border border-violet-800/40 backdrop-blur-sm">
            {drop.brand}
          </span>
        )}

        {/* Low stock warning */}
        {isLow && !isSoldOut && (
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-950/80 text-amber-400 px-2 py-0.5 rounded-full border border-amber-800/40 backdrop-blur-sm animate-pulse">
            Only {availableStock} left!
          </span>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Name + colorway */}
        <div>
          <h2 className="text-base font-bold text-slate-100 leading-tight line-clamp-2">
            {drop.name}
          </h2>
          {drop.colorway && (
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Tag size={10} />
              {drop.colorway}
            </p>
          )}
          {drop.description && (
            <p className="text-xs text-slate-600 mt-1 flex items-start gap-1 line-clamp-2">
              <Info size={10} className="mt-0.5 shrink-0" />
              {drop.description}
            </p>
          )}
        </div>

        {/* ── Price + Live Stock Count ── */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-extrabold text-white tracking-tight">
              <span className="text-sm font-normal text-slate-500 mr-0.5">$</span>
              {formatPrice(drop.price)}
            </span>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-bold",
              stockColor
            )}
          >
            <Package size={14} />
            <span>{availableStock}</span>
            <span className="text-slate-600 font-normal text-xs">
              / {drop.totalStock}
            </span>
          </div>
        </div>

        {/* ── Stock Progress Bar ── (real-time via Redux) */}
        <div
          className="h-1.5 rounded-full bg-slate-800"
          title={`${availableStock} of ${drop.totalStock} available`}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              stockBarColor
            )}
            style={{ width: `${Math.min(100, Math.max(0, stockPct))}%` }}
          />
        </div>

        {/* ── Reserve / Purchase CTA ── */}
        <div className="mt-1">
          <ReservePurchaseButton
            dropId={drop.id}
            availableStock={availableStock}
          />
        </div>

        {/* ── Activity Feed: top 3 recent purchasers ── */}
        <ActivityFeed purchasers={purchasers} />
      </div>
    </div>
  );
};
