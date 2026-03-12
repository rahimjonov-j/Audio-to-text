import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import Column from './components/Column.jsx';
import api from './services/api.js';
import { useKitchenStore } from './store/useKitchenStore.js';
import { useOrdersStream } from './realtime/useOrdersStream.js';

export default function App() {
  const orders = useKitchenStore((state) => state.orders);
  const setOrders = useKitchenStore((state) => state.setOrders);
  const [draggingId, setDraggingId] = useState(null);

  const { data } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data } = await api.get('/orders');
      return data.orders;
    }
  });

  useEffect(() => {
    if (data) {
      setOrders(data);
    }
  }, [data, setOrders]);

  useOrdersStream();

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status });
      return data.order;
    },
    onSuccess: (order) => {
      setOrders(orders.map((item) => (item.id === order.id ? order : item)));
    }
  });

  const handleStatusChange = (id, status) => {
    statusMutation.mutate({ id, status });
  };

  const handleDropStatus = (id, status) => {
    handleStatusChange(id, status);
    setDraggingId(null);
  };

  const grouped = {
    NEW: orders.filter((order) => order.status === 'NEW'),
    COOKING: orders.filter((order) => order.status === 'COOKING'),
    READY: orders.filter((order) => order.status === 'READY'),
    COMPLETED: orders.filter((order) => order.status === 'COMPLETED')
  };

  return (
    <div className="kitchen-shell px-6 pb-10 pt-10">
      <header className="panel mb-8 flex flex-wrap items-center justify-between gap-4 px-8 py-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Kitchen Control</p>
          <h1 className="text-3xl font-semibold">Oshxona buyurtmalari</h1>
          <p className="text-sm text-[var(--muted)]">Real vaqtda yangilanadi.</p>
        </div>
        <div className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">
          {orders.length} buyurtma
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-3">
        <Column
          title="Yangi"
          status="NEW"
          orders={grouped.NEW}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          onStatusChange={handleStatusChange}
          onDropStatus={handleDropStatus}
        />
        <Column
          title="Tayyorlanmoqda"
          status="COOKING"
          orders={grouped.COOKING}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          onStatusChange={handleStatusChange}
          onDropStatus={handleDropStatus}
        />
        <Column
          title="Tayyor"
          status="READY"
          orders={grouped.READY}
          draggingId={draggingId}
          setDraggingId={setDraggingId}
          onStatusChange={handleStatusChange}
          onDropStatus={handleDropStatus}
        />
      </main>

      <section className="mt-10">
        <h3 className="text-lg font-semibold">Tugalanganlar</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {grouped.COMPLETED.map((order) => (
            <div key={order.id} className="panel p-4">
              <p className="text-sm uppercase text-[var(--muted)]">Stol {order.stol}</p>
              <p className="text-lg font-semibold">{order.buyurtma_id}</p>
              <div className="mt-3 space-y-1 text-sm text-[var(--muted)]">
                {order.mahsulotlar.map((item, index) => (
                  <div key={`${order.id}-c-${index}`}>
                    {item.nomi} x {item.miqdor}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {grouped.COMPLETED.length === 0 && (
            <div className="text-sm text-[var(--muted)]">Hozircha tugalangan buyurtmalar yo'q.</div>
          )}
        </div>
      </section>
    </div>
  );
}
