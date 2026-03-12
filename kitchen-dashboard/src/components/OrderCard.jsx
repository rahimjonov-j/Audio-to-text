const badgeStyles = {
  NEW: 'bg-blue-100 text-blue-700',
  COOKING: 'bg-amber-100 text-amber-700',
  READY: 'bg-emerald-100 text-emerald-700',
  COMPLETED: 'bg-slate-200 text-slate-700'
};

const badgeLabels = {
  NEW: 'Yangi',
  COOKING: 'Tayyorlanmoqda',
  READY: 'Tayyor',
  COMPLETED: 'Tugalandi'
};

export default function OrderCard({ order, onStatusChange, setDraggingId }) {
  const handleDragStart = (event) => {
    event.dataTransfer.setData('text/plain', order.id);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handlePointerDown = () => {
    setDraggingId(order.id);
  };

  const handlePointerUp = () => {
    setDraggingId(null);
  };

  return (
    <div
      className="panel flex cursor-grab flex-col gap-4 p-4 transition-all duration-300 active:cursor-grabbing"
      draggable
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase text-[var(--muted)]">Stol {order.stol}</p>
          <p className="text-xl font-semibold">{order.buyurtma_id}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badgeStyles[order.status]}`}>
          {badgeLabels[order.status]}
        </div>
      </div>

      <div className="space-y-2">
        {order.mahsulotlar.map((item, index) => (
          <div key={`${order.id}-${index}`} className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2">
            <div>
              <p className="font-medium">
                {item.nomi} x {item.miqdor}
              </p>
              <p className="text-xs text-[var(--muted)]">{item.tavsif}</p>
            </div>
          </div>
        ))}
      </div>

      {order.status === 'READY' && (
        <button
          type="button"
          onClick={() => onStatusChange(order.id, 'COMPLETED')}
          className="cursor-pointer rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
        >
          Tugalandi
        </button>
      )}
    </div>
  );
}
