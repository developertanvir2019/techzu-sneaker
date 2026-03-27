import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { Drop, useCheckReservationQuery } from "../services/api";
import { ReserveButton } from "./ReserveButton";
import { PurchaseButton } from "./PurchaseButton";
import { CountdownTimer } from "./CountdownTimer";
import { ActivityFeed } from "./ActivityFeed";
import { Package, Tag, Layers } from "lucide-react";

interface Props {
  drop: Drop;
}

export const DropCard = ({ drop }: Props) => {
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  const stockOverride = useSelector(
    (s: RootState) => s.drops.stockMap[drop.id]
  );
  const liveStock =
    stockOverride !== undefined ? stockOverride : drop.availableStock;

  const { data: reservation, refetch } = useCheckReservationQuery(
    { userId: currentUser?.id || "", dropId: drop.id },
    { skip: !currentUser, pollingInterval: 5000 }
  );

  const hasActiveReservation = reservation?.status === "ACTIVE";
  const stockPct = Math.round((liveStock / drop.totalStock) * 100);
  const isCritical = liveStock <= Math.ceil(drop.totalStock * 0.2);
  const isSoldOut = liveStock === 0;

  return (
    <article className={`drop-card ${isSoldOut ? "sold-out" : ""}`}>
      {/* ── Image ── */}
      <div className="card-image-wrap">
        {drop.imageUrl ? (
          <img src={drop.imageUrl} alt={drop.name} className="card-image" />
        ) : (
          <div className="card-image-placeholder">
            <Package size={48} />
          </div>
        )}
        <div className={`stock-pill ${isCritical ? "critical" : ""} ${isSoldOut ? "zero" : ""}`}>
          {isSoldOut ? "SOLD OUT" : `${liveStock} LEFT`}
        </div>
      </div>

      {/* ── Info ── */}
      <div className="card-body">
        <div className="card-meta">
          {drop.brand && (
            <span className="card-brand">
              <Tag size={11} /> {drop.brand}
            </span>
          )}
          {drop.colorway && (
            <span className="card-colorway">
              <Layers size={11} /> {drop.colorway}
            </span>
          )}
        </div>

        <h2 className="card-name">{drop.name}</h2>

        {drop.description && (
          <p className="card-description">{drop.description}</p>
        )}

        <div className="card-price">${drop.price.toLocaleString()}</div>

        {/* ── Stock Bar ── */}
        <div className="stock-section">
          <div className="stock-label">
            <span>Stock: <strong>{liveStock}</strong> / {drop.totalStock}</span>
            <span className={`stock-pct ${isCritical ? "critical" : ""}`}>{stockPct}%</span>
          </div>
          <div className="stock-bar-bg">
            <div
              className={`stock-bar-fill ${isCritical ? "critical" : ""}`}
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>

        {/* ── Countdown (if reserved) ── */}
        {hasActiveReservation && reservation && (
          <CountdownTimer
            expiresAt={reservation.expiresAt}
            onExpire={refetch}
          />
        )}

        {/* ── CTA Buttons ── */}
        <div className="card-actions">
          <ReserveButton
            dropId={drop.id}
            availableStock={liveStock}
            hasActiveReservation={hasActiveReservation}
          />
          <PurchaseButton
            dropId={drop.id}
            hasActiveReservation={hasActiveReservation}
            onSuccess={refetch}
          />
        </div>

        {/* ── Activity Feed ── */}
        <ActivityFeed purchasers={drop.recentPurchasers} />
      </div>
    </article>
  );
};
