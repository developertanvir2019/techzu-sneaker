import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../services/api";

interface AuthState {
  currentUser: User | null;
}

const initialState: AuthState = {
  currentUser: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
