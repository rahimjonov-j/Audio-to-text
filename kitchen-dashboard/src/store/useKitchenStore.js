import { create } from 'zustand';

export const useKitchenStore = create((set) => ({
  orders: [],
  setOrders: (orders) => set({ orders }),
  upsertOrder: (order) =>
    set((state) => {
      const index = state.orders.findIndex((item) => item.id === order.id);
      if (index >= 0) {
        const copy = [...state.orders];
        copy[index] = order;
        return { orders: copy };
      }
      return { orders: [order, ...state.orders] };
    })
}));
