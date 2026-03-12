import OrderCard from './OrderCard.jsx';

export default function Column({
  title,
  status,
  orders,
  draggingId,
  setDraggingId,
  onStatusChange,
  onDropStatus
}) {
  const isActive = Boolean(draggingId);

  const handleDrop = (event) => {
    event.preventDefault();
    const orderId = event.dataTransfer?.getData('text/plain') || draggingId;
    if (orderId) {
      onDropStatus(orderId, status);
    }
  };

  const handlePointerUp = () => {
    if (draggingId) {
      onDropStatus(draggingId, status);
    }
  };

  return (
    <section
      className={`flex flex-col gap-4 rounded-3xl border border-transparent p-2 transition ${
        isActive ? 'column-drop-active' : ''
      }`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => setDraggingId(null)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold">
          {orders.length}
        </span>
      </div>
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onStatusChange={onStatusChange}
            setDraggingId={setDraggingId}
          />
        ))}
      </div>
    </section>
  );
}
