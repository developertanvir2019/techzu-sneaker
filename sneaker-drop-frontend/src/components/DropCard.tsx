import { useSelector } from "react-redux";
import { Zap, Package, Tag } from "lucide-react";
import { cn } from "../lib/utils";
import type { Drop } from "../services/api";
import type { RootState } from "../app/store";
import { ActivityFeed } from "./ActivityFeed";
import { ReservePurchaseButton } from "./ReserveButton";

interface DropCardProps {
  drop: Drop;
}

export const DropCard = ({ drop }: DropCardProps) => {
  const stockMap = useSelector((s: RootState) => s.drops.stockMap);
  const purchasersMap = useSelector((s: RootState) => s.drops.purchasersMap);

  const availableStock = stockMap[drop.id] ?? drop.availableStock;
  const purchasers = purchasersMap[drop.id] ?? drop.recentPurchasers ?? [];

  const stockPct = drop.totalStock > 0
    ? (availableStock / drop.totalStock) * 100
    : 0;
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

  const price = typeof drop.price === "number"
    ? (drop.price / 100).toFixed(2)
    : drop.price;

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 hover:shadow-violet-900/10 transition-all duration-300 group">
      {/* Card glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Image / placeholder */}
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
        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-slate-900/70 flex items-center justify-center backdrop-blur-sm">
            <span className="text-lg font-bold text-red-400 tracking-widest uppercase">
              Sold Out
            </span>
          </div>
        )}
        {/* Brand badge */}
        {drop.brand && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-slate-900/80 text-violet-300 px-2 py-0.5 rounded-full border border-violet-800/40 backdrop-blur-sm">
            {drop.brand}
          </span>
        )}
      </div>

      {/* Content */}
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
        </div>

        {/* Price + Stock */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-extrabold text-white tracking-tight">
            <span className="text-sm font-normal text-slate-500 mr-0.5">$</span>
            {price}
          </span>
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", stockColor)}>
            <Package size={14} />
            <span>{availableStock}</span>
            <span className="text-slate-600 font-normal text-xs">
              / {drop.totalStock}
            </span>
          </div>
        </div>

        {/* Stock bar */}
        <div className="h-1.5 rounded-full bg-slate-800">
          <div
            className={cn("h-full rounded-full transition-all duration-700", stockBarColor)}
            style={{ width: `${Math.min(100, stockPct)}%` }}
          />
        </div>

        {/* Reserve / Purchase */}
        <div className="mt-auto">
          <ReservePurchaseButton
            dropId={drop.id}
            availableStock={availableStock}
          />
        </div>

        {/* Activity Feed */}
        <ActivityFeed purchasers={purchasers} />
      </div>
    </div>
  );
};
