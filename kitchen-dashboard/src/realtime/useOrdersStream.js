import { useEffect } from 'react';
import { useKitchenStore } from '../store/useKitchenStore.js';

export function useOrdersStream() {
  const upsertOrder = useKitchenStore((state) => state.upsertOrder);

  useEffect(() => {
    const url = `${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000'}/orders/stream`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'orders_change' && payload.payload?.new) {
          upsertOrder(payload.payload.new);
        }
      } catch {
        // ignore
      }
    };

    return () => {
      eventSource.close();
    };
  }, [upsertOrder]);
}
