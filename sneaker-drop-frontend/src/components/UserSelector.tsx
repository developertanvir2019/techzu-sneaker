import { useDispatch } from "react-redux";
import { AppDispatch } from "../app/store";
import { setCurrentUser } from "../features/auth/authSlice";
import { useGetUsersQuery } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { User } from "lucide-react";

export const UserSelector = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data: users, isLoading } = useGetUsersQuery();
  const currentUser = useSelector((s: RootState) => s.auth.currentUser);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const user = users?.find((u) => u.id === e.target.value);
    if (user) dispatch(setCurrentUser(user));
  };

  if (isLoading) return <div className="user-selector-loading">Loading users...</div>;

  return (
    <div className="user-selector">
      <User size={16} className="user-icon" />
      <select
        value={currentUser?.id || ""}
        onChange={handleChange}
        className="user-select"
        id="user-selector"
      >
        <option value="" disabled>
          Select your identity...
        </option>
        {users?.map((u) => (
          <option key={u.id} value={u.id}>
            {u.username}
          </option>
        ))}
      </select>
      {currentUser && (
        <span className="user-badge">
          You are: <strong>{currentUser.username}</strong>
        </span>
      )}
    </div>
  );
};
