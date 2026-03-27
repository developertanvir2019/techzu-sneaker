import { Crown, User } from "lucide-react";
import { Purchaser } from "../services/api";

interface Props {
  purchasers: Purchaser[];
}

export const ActivityFeed = ({ purchasers }: Props) => {
  if (purchasers.length === 0) {
    return (
      <div className="activity-empty">
        <span>No purchases yet — be the first! 🔥</span>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-title">
        <Crown size={13} /> Recent Buyers
      </div>
      <ul className="activity-list">
        {purchasers.map((p, i) => (
          <li key={p.purchaseId} className="activity-item">
            <span className={`activity-rank rank-${i + 1}`}>#{i + 1}</span>
            <User size={12} />
            <span className="activity-username">{p.username}</span>
            <span className="activity-time">
              {new Date(p.purchasedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
