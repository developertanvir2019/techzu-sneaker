import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Drop, Purchaser } from "../../services/api";

interface DropsState {
  // dropId -> availableStock (live overrides from socket)
  stockMap: Record<string, number>;
  // dropId -> recentPurchasers (live updates from socket)
  purchasersMap: Record<string, Purchaser[]>;
}

const initialState: DropsState = {
  stockMap: {},
  purchasersMap: {},
};

export const dropsSlice = createSlice({
  name: "drops",
  initialState,
  reducers: {
    /** Called on initial data load to seed the stock map */
    setStockMap: (state, action: PayloadAction<Drop[]>) => {
      action.payload.forEach((d) => {
        state.stockMap[d.id] = d.availableStock;
        state.purchasersMap[d.id] = d.recentPurchasers ?? [];
      });
    },
    /** Called on stock:update socket event */
    updateStock: (
      state,
      action: PayloadAction<{ id: string; availableStock: number }>
    ) => {
      state.stockMap[action.payload.id] = action.payload.availableStock;
    },
    /** Called on purchase:confirmed socket event — prepend new purchaser */
    addPurchaser: (
      state,
      action: PayloadAction<{ dropId: string; username: string }>
    ) => {
      const { dropId, username } = action.payload;
      const existing = state.purchasersMap[dropId] ?? [];
      state.purchasersMap[dropId] = [{ username }, ...existing].slice(0, 3);
    },
  },
});

export const { setStockMap, updateStock, addPurchaser } = dropsSlice.actions;
export default dropsSlice.reducer;
