import type { Purchaser } from "../services/api";
import { ShoppingBag } from "lucide-react";

interface ActivityFeedProps {
  purchasers: Purchaser[];
}

export const ActivityFeed = ({ purchasers }: ActivityFeedProps) => {
  if (!purchasers || purchasers.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/60">
      <div className="flex items-center gap-1.5 mb-2">
        <ShoppingBag size={11} className="text-violet-400" />
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
          Recent Buyers
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {purchasers.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[9px] text-white font-bold uppercase shrink-0">
              {p.username.charAt(0)}
            </div>
            <span className="text-xs text-slate-300 truncate">{p.username}</span>
            {i === 0 && (
              <span className="ml-auto text-[10px] text-violet-400 font-semibold shrink-0">
                latest
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
