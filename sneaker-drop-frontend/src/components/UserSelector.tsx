import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { setUser } from "../features/auth/authSlice";
import { useGetUsersQuery } from "../services/api";
import { User } from "lucide-react";

export const UserSelector = () => {
  const dispatch = useDispatch<AppDispatch>();
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);
  const { data: users, isLoading } = useGetUsersQuery();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-slate-400">
        <User size={14} />
        <span className="text-xs font-medium hidden sm:block">Identity:</span>
      </div>
      <select
        value={currentUser?.id ?? ""}
        onChange={(e) => {
          const user = users?.find((u) => u.id === e.target.value) ?? null;
          dispatch(setUser(user));
        }}
        className="bg-slate-800/80 text-slate-100 text-sm border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer w-36 sm:w-44 truncate"
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? "Loading…" : "Select user…"}
        </option>
        {users?.map((u) => (
          <option key={u.id} value={u.id}>
            {u.username}
          </option>
        ))}
      </select>
    </div>
  );
};
