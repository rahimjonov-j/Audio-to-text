import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import MicButton from '../components/MicButton.jsx';
import OrderPreview from '../components/OrderPreview.jsx';
import { useRecorder } from '../hooks/useRecorder.js';
import api from '../services/api.js';
import { useOrderStore } from '../store/useOrderStore.js';

const toBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64 ?? '');
    };
    reader.onerror = () => reject(new Error('Audio oqib bolmadi'));
    reader.readAsDataURL(blob);
  });

export default function VoiceOrderPage() {
  const recorder = useRecorder();
  const {
    state,
    transcription,
    parsedOrder,
    storedOrder,
    setState,
    setTranscription,
    setParsedOrder,
    setStoredOrder,
    setError,
    error,
    reset
  } = useOrderStore();

  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const voiceOrderMutation = useMutation({
    mutationFn: async (payload) => {
      const { data } = await api.post('/voice-order', payload);
      return data;
    },
    onSuccess: (data) => {
      setTranscription(data.transcription);
      setParsedOrder(data.order);
      setStoredOrder(data.order);
      setState('preview');
      setToast({ type: 'success', message: 'Buyurtma muvaffaqiyatli tahlil qilindi' });
    },
    onError: (err) => {
      setState('error');
      const message = err?.response?.data?.message ?? 'Xatolik yuz berdi';
      setError(message);
      setToast({ type: 'error', message });
    }
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch(`/orders/${id}/status`, { status });
      return data.order;
    },
    onSuccess: (order) => {
      setStoredOrder(order);
      setToast({ type: 'success', message: 'Buyurtma oshxonaga jonatildi' });
    },
    onError: (err) => {
      const message = err?.response?.data?.message ?? 'Status yangilanmadi';
      setError(message);
      setToast({ type: 'error', message });
    }
  });

  const handleMicClick = async () => {
    if (state === 'recording') {
      setState('processing');
      const result = await recorder.stop();
      if (!result) {
        setState('error');
        setError('Audio topilmadi');
        setToast({ type: 'error', message: 'Audio topilmadi' });
        return;
      }
      if (result.blob.size < 1500) {
        setState('error');
        setError('Audio juda qisqa. Qayta yozib koring.');
        setToast({ type: 'error', message: 'Audio juda qisqa' });
        return;
      }
      try {
        const audioBase64 = await toBase64(result.blob);
        if (!audioBase64 || audioBase64.length < 50) {
          setState('error');
          setError('Audio format noto‘g‘ri yoki bosh.');
          setToast({ type: 'error', message: 'Audio format noto‘g‘ri' });
          return;
        }
        await voiceOrderMutation.mutateAsync({
          audioBase64,
          mimeType: result.mimeType || 'audio/webm'
        });
      } catch (err) {
        const message = err?.message ?? 'Audio qayta ishlanmadi';
        setState('error');
        setError(message);
        setToast({ type: 'error', message });
      }
      return;
    }

    if (state === 'idle' || state === 'error' || state === 'preview') {
      setError(null);
      reset();
      setState('recording');
      await recorder.start();
    }
  };

  const handleEdit = () => {
    if (!transcription) return;
    setDraftText(transcription);
    setEditing(true);
  };

  const handleReparse = async () => {
    if (!draftText.trim()) {
      setError('Matn bosh bolmasin');
      setToast({ type: 'error', message: 'Matn bosh bolmasin' });
      return;
    }
    setEditing(false);
    setState('processing');
    await voiceOrderMutation.mutateAsync({
      text: draftText,
      updateOrderId: storedOrder?.id
    });
  };

  const handleSend = async () => {
    if (!storedOrder) return;
    await statusMutation.mutateAsync({ id: storedOrder.id, status: 'NEW' });
    setState('preview');
  };

  return (
    <main className="relative flex-1 px-6 pb-16 pt-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="glass rounded-3xl px-8 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--muted)]">Voice Order Desk</p>
              <h1 className="text-4xl font-semibold">Ovqat buyurtmasi ovoz orqali</h1>
              <p className="mt-2 max-w-xl text-[var(--muted)]">
                Mikrofonni bosib buyurtmani ayting. Sistema buyurtmani avtomatik tuzadi va oshxonaga yuboradi.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <MicButton state={state} onClick={handleMicClick} />
              {state === 'recording' && (
                <div className="wave-bars" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>
          </div>
        </header>

        {state === 'processing' && (
          <section className="glass rounded-3xl p-8">
            <p className="text-lg font-medium">Audio tahlil qilinmoqda...</p>
            <p className="text-sm text-[var(--muted)]">Biroz kuting, tizim buyurtmani tayyorlayapti.</p>
          </section>
        )}

        {state === 'error' && error && (
          <section className="glass rounded-3xl border border-red-200 bg-red-50/70 p-6">
            <p className="text-lg font-semibold text-red-700">Xatolik</p>
            <p className="text-sm text-red-600">{error}</p>
          </section>
        )}

        {editing && (
          <section className="glass rounded-3xl p-6">
            <h3 className="text-xl font-semibold">Buyurtma matnini tahrirlash</h3>
            <textarea
              className="mt-4 w-full rounded-2xl border border-[var(--surface-2)] bg-white p-4 text-sm"
              rows={5}
              value={draftText}
              onChange={(event) => setDraftText(event.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="button-ring cursor-pointer rounded-full border border-[var(--muted)] px-5 py-2 text-sm font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleReparse}
                className="button-ring cursor-pointer rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white"
              >
                Qayta tahlil qilish
              </button>
            </div>
          </section>
        )}

        {parsedOrder && !editing && (
          <OrderPreview order={parsedOrder} stored={storedOrder} onEdit={handleEdit} onSend={handleSend} />
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.message}
        </div>
      )}

      <div className="wave" />
    </main>
  );
}
