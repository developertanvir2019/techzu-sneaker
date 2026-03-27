import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { useGetDropsQuery } from "../services/api";
import { setStockMap } from "../features/drops/dropsSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../app/store";
import { useEffect } from "react";
import { DropCard } from "../components/DropCard";
import { UserSelector } from "../components/UserSelector";
import { useSocket } from "../socket/useSocket";
import { Zap, Wifi } from "lucide-react";

export const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);

  // Connect WebSocket (user context for personalized toasts)
  useSocket(currentUser?.id);

  const { data: drops, isLoading, isError, refetch } = useGetDropsQuery(undefined, {
    pollingInterval: 30000, // Fallback polling every 30s
  });

  // Initialize stock map on first load
  useEffect(() => {
    if (drops) dispatch(setStockMap(drops));
  }, [drops, dispatch]);

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-wrap">
            <Zap size={24} className="logo-icon" />
            <div>
              <h1 className="header-title">SneakerDrop</h1>
              <p className="header-sub">Limited Edition Releases · Live Inventory</p>
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="live-badge">
            <Wifi size={12} />
            <span>LIVE</span>
            <span className="live-dot" />
          </div>
          <UserSelector />
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="dashboard-main">
        {!currentUser && (
          <div className="alert-banner">
            ⚡ Select your identity above to reserve and purchase sneakers
          </div>
        )}

        {isLoading && (
          <div className="cards-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="drop-card skeleton">
                <div className="skeleton-image" />
                <div className="skeleton-body">
                  <div className="skeleton-line w-1/2" />
                  <div className="skeleton-line w-3/4" />
                  <div className="skeleton-line w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="error-state">
            <p>⚠️ Failed to load drops.</p>
            <button onClick={refetch} className="retry-btn">Retry</button>
          </div>
        )}

        {drops && drops.length === 0 && (
          <div className="empty-state">
            <Zap size={48} />
            <h2>No drops yet</h2>
            <p>Check back soon for upcoming limited releases!</p>
          </div>
        )}

        {drops && drops.length > 0 && (
          <div className="cards-grid">
            {drops.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="dashboard-footer">
        <p>Stock updates in real-time · All sales final · Limited quantities per person</p>
      </footer>
    </div>
  );
};
