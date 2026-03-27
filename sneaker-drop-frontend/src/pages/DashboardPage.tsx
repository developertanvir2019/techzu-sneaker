import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import { useGetDropsQuery } from "../services/api";
import { setStockMap } from "../features/drops/dropsSlice";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../app/store";
import { useEffect } from "react";
import { DropCard } from "../components/DropCard";
import { UserSelector } from "../components/UserSelector";
import { useSocket } from "../socket/useSocket";
import { Zap, Wifi, RefreshCw } from "lucide-react";

export const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);

  // Connect WebSocket with optional user context for personalised toasts
  useSocket(currentUser?.id);

  const {
    data: drops,
    isLoading,
    isError,
    refetch,
  } = useGetDropsQuery(undefined, {
    pollingInterval: 30000,
  });

  // Seed stock + purchasers map from initial API fetch
  useEffect(() => {
    if (drops) dispatch(setStockMap(drops));
  }, [drops, dispatch]);

  return (
    <div className="min-h-screen bg-[#0b0d14] text-white flex flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0b0d14]/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <Zap size={18} className="text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-extrabold tracking-tight leading-none text-white">
                SneakerDrop
              </h1>
              <p className="text-[11px] text-slate-500 leading-none mt-0.5">
                Limited Releases · Live Inventory
              </p>
            </div>
          </div>

          {/* Right: LIVE badge + user */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
              <Wifi size={11} />
              <span>LIVE</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
            </div>
            <UserSelector />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Alert: no user */}
        {!currentUser && (
          <div className="mb-6 flex items-center gap-3 bg-violet-950/40 border border-violet-800/40 text-violet-300 rounded-xl px-4 py-3 text-sm">
            <Zap size={16} className="shrink-0 text-violet-400" />
            <span>Select your identity above to reserve and purchase sneakers.</span>
          </div>
        )}

        {/* ── Loading Skeleton ── */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-slate-800" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-4 bg-slate-800 rounded-full w-3/4" />
                  <div className="h-3 bg-slate-800 rounded-full w-1/2" />
                  <div className="h-6 bg-slate-800 rounded-full w-1/3" />
                  <div className="h-1.5 bg-slate-800 rounded-full w-full" />
                  <div className="h-10 bg-slate-800 rounded-xl w-full mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <span className="text-5xl">⚠️</span>
            <p className="text-slate-300 font-medium">Failed to load drops.</p>
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sm text-white rounded-xl transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {drops && drops.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Zap size={32} className="text-slate-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-300">No drops yet</h2>
            <p className="text-slate-500 max-w-xs">
              Check back soon for upcoming limited releases!
            </p>
          </div>
        )}

        {/* ── Cards Grid ── */}
        {drops && drops.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Active Drops · {drops.length}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {drops.map((drop) => (
                <DropCard key={drop.id} drop={drop} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/60 py-4">
        <p className="text-center text-xs text-slate-600">
          Stock updates in real-time · All sales final · Limited quantities per person
        </p>
      </footer>
    </div>
  );
};
