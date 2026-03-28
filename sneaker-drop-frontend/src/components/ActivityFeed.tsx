import type { Purchaser } from "../services/api";
import { ShoppingBag, Clock } from "lucide-react";

interface ActivityFeedProps {
  purchasers: Purchaser[];
}

// Colours for avatar backgrounds (cycling by index)
const AVATAR_COLORS = [
  "from-violet-500 to-fuchsia-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
];

const formatTime = (iso?: string): string => {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

export const ActivityFeed = ({ purchasers }: ActivityFeedProps) => {
  if (!purchasers || purchasers.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-700/60">
      <div className="flex items-center gap-1.5 mb-2">
        <ShoppingBag size={11} className="text-violet-400" />
        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">
          Recent Buyers
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {purchasers.map((p, i) => (
          <div key={p.purchaseId ?? i} className="flex items-center gap-2">
            {/* Avatar */}
            <div
              className={`w-6 h-6 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-[9px] text-white font-bold uppercase shrink-0`}
            >
              {p.username.charAt(0)}
            </div>

            {/* Username */}
            <span className="text-xs text-slate-300 truncate flex-1">
              {p.username}
            </span>

            {/* Timestamp */}
            {p.purchasedAt && (
              <span className="flex items-center gap-0.5 text-[10px] text-slate-600 shrink-0">
                <Clock size={9} />
                {formatTime(p.purchasedAt)}
              </span>
            )}

            {/* "latest" badge on first */}
            {i === 0 && !p.purchasedAt && (
              <span className="text-[10px] text-violet-400 font-semibold shrink-0">
                latest
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
