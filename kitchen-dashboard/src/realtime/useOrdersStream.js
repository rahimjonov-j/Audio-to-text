import { useEffect } from 'react';
import { useKitchenStore } from '../store/useKitchenStore.js';
import { getBackendUrl } from '../services/backendUrl.js';

export function useOrdersStream() {
  const upsertOrder = useKitchenStore((state) => state.upsertOrder);

  useEffect(() => {
    const baseURL = getBackendUrl();
    if (!baseURL) {
      return undefined;
    }

    const url = `${baseURL}/orders/stream`;
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
