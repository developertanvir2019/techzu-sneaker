import { useEffect, useState } from "react";
import { cn } from "../lib/utils";

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
}

export const CountdownTimer = ({ expiresAt, onExpire }: CountdownTimerProps) => {
  const getRemaining = () =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));

  const [remaining, setRemaining] = useState(getRemaining);

  useEffect(() => {
    setRemaining(getRemaining());
    const interval = setInterval(() => {
      const r = getRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const label = `${mins}:${String(secs).padStart(2, "0")}`;
  const isUrgent = remaining <= 15;
  const pct = Math.min(100, (remaining / 60) * 100);

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400">Reservation expires in</span>
        <span
          className={cn(
            "font-mono font-bold text-sm",
            isUrgent ? "text-red-400 animate-pulse" : "text-emerald-400"
          )}
        >
          {label}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-1000",
            isUrgent ? "bg-red-500" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
