import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";

interface Props {
  expiresAt: string;
  onExpire?: () => void;
}

export const CountdownTimer = ({ expiresAt, onExpire }: Props) => {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(diff);
      if (diff === 0) onExpireRef.current?.();
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const pct = Math.max(0, (secondsLeft / 60) * 100);
  const isUrgent = secondsLeft <= 10;

  return (
    <div className={`countdown ${isUrgent ? "urgent" : ""}`}>
      <div className="countdown-header">
        <Clock size={13} />
        <span>Reservation expires in</span>
      </div>
      <div className="countdown-bar-wrap">
        <div className="countdown-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="countdown-seconds">
        {secondsLeft}s remaining
      </div>
    </div>
  );
};
