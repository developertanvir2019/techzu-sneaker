import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Drop {
  id: string;
  name: string;
  price: number;
  totalStock: number;
  availableStock: number;
  startTime: string;
  imageUrl?: string;
  description?: string;
  brand?: string;
  colorway?: string;
  createdAt: string;
  recentPurchasers: {
    purchaseId: string;
    userId: string;
    username: string;
    purchasedAt: string;
  }[];
}

interface DropsState {
  stockMap: Record<string, number>; // dropId → availableStock (real-time)
}

const initialState: DropsState = {
  stockMap: {},
};

const dropsSlice = createSlice({
  name: "drops",
  initialState,
  reducers: {
    updateStock(state, action: PayloadAction<Drop>) {
      state.stockMap[action.payload.id] = action.payload.availableStock;
    },
    setStockMap(state, action: PayloadAction<Drop[]>) {
      action.payload.forEach((drop) => {
        state.stockMap[drop.id] = drop.availableStock;
      });
    },
  },
});

export const { updateStock, setStockMap } = dropsSlice.actions;
export default dropsSlice.reducer;
