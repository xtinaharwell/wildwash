import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RiderOrderNotificationState {
  availableOrdersCount: number;
  unseenOrdersCount: number;
  lastUpdated: string | null;
}

const initialState: RiderOrderNotificationState = {
  availableOrdersCount: 0,
  unseenOrdersCount: 0,
  lastUpdated: null,
};

const riderOrderNotificationSlice = createSlice({
  name: 'riderOrderNotification',
  initialState,
  reducers: {
    // Set the count of available orders when first loaded
    setAvailableOrdersCount: (state, action: PayloadAction<number>) => {
      state.availableOrdersCount = action.payload;
      state.unseenOrdersCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Update available orders count (e.g., when orders list is refreshed)
    updateAvailableOrdersCount: (state, action: PayloadAction<number>) => {
      state.availableOrdersCount = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Decrement count when rider assigns an order
    decrementAvailableOrdersCount: (state, action: PayloadAction<number>) => {
      const decrement = action.payload || 1;
      state.availableOrdersCount = Math.max(0, state.availableOrdersCount - decrement);
      state.lastUpdated = new Date().toISOString();
    },

    // Reset notifications (when switching pages or clearing)
    resetOrderNotifications: (state) => {
      state.availableOrdersCount = 0;
      state.unseenOrdersCount = 0;
      state.lastUpdated = null;
    },

    // Mark orders as seen (when rider views the notification)
    markOrdersAsSeen: (state) => {
      state.unseenOrdersCount = 0;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

export const {
  setAvailableOrdersCount,
  updateAvailableOrdersCount,
  decrementAvailableOrdersCount,
  resetOrderNotifications,
  markOrdersAsSeen,
} = riderOrderNotificationSlice.actions;

export default riderOrderNotificationSlice.reducer;
