import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, CheckCircle2, AlertCircle } from 'lucide-react'; // Ikonkalar
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

  // Modalni to'liq yopish va state'ni tozalash
  const handleCloseModal = () => {
    setEditing(false);
    reset(); // store'dagi ma'lumotlarni tozalash orqali modalni yopadi
  };

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
      setToast({ type: 'success', message: 'Muvaffaqiyatli tahlil qilindi ✨' });
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
      setToast({ type: 'success', message: 'Buyurtma oshxonaga yuborildi 🚀' });
      handleCloseModal(); // <--- JONATILGACH MODAL YOPILADI
    },
    onError: (err) => {
      const message = err?.response?.data?.message ?? 'Xatolik yuz berdi';
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
        return;
      }
      try {
        const audioBase64 = await toBase64(result.blob);
        await voiceOrderMutation.mutateAsync({
          audioBase64,
          mimeType: result.mimeType || 'audio/webm'
        });
      } catch (err) {
        setState('error');
        setError(err.message);
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

  const handleEdit = () => { transcription && (setDraftText(transcription), setEditing(true)); };
  
  const handleReparse = async () => {
    setEditing(false);
    setState('processing');
    await voiceOrderMutation.mutateAsync({ text: draftText, updateOrderId: storedOrder?.id });
  };

  const handleSend = async () => {
    if (!storedOrder) return;
    await statusMutation.mutateAsync({ id: storedOrder.id, status: 'NEW' });
  };

  return (
    <main className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#050505] text-white">
      
      {/* Background Glow */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${state === 'recording' ? 'opacity-30' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#3b82f6_0%,_transparent_70%)] blur-[120px]" />
      </div>

      {/* Mic Section */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className={`transition-all duration-500 transform ${state === 'recording' ? 'scale-125' : 'scale-100'}`}>
           <MicButton state={state} onClick={handleMicClick} />
        </div>
        
        <div className="h-6 flex items-center justify-center">
            {state === 'recording' && (
                <span className="text-[10px] font-bold tracking-[0.5em] text-blue-500 uppercase animate-pulse">Recording</span>
            )}
            {state === 'processing' && (
                <span className="text-[10px] font-bold tracking-[0.5em] text-gray-500 uppercase animate-bounce">Processing</span>
            )}
        </div>
      </div>

      {/* POP-UP MODAL (Dark Premium) */}
      {(parsedOrder || editing) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-[#0f0f0f] border border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] rounded-[2.5rem] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                {editing ? 'Tahrirlash' : 'Buyurtma Ma\'lumotlari'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors group"
              >
                <X size={20} className="text-gray-400 group-hover:text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              {editing ? (
                <div className="space-y-6">
                  <textarea
                    className="w-full rounded-2xl bg-white/[0.03] p-5 text-white border border-white/10 focus:border-blue-500/50 outline-none transition-all resize-none font-light leading-relaxed"
                    rows={5}
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                  />
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setEditing(false)} 
                      className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button 
                      onClick={handleReparse} 
                      className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-black text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                    >
                      Yangilash
                    </button>
                  </div>
                </div>
              ) : (
                <OrderPreview order={parsedOrder} stored={storedOrder} onEdit={handleEdit} onSend={handleSend} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* HIGH Z-INDEX TOASTS */}
      {toast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-10 fade-in duration-500">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-3xl shadow-2xl border ${
            toast.type === 'error' 
              ? 'bg-red-500/10 border-red-500/20 text-red-500' 
              : 'bg-green-500 border-green-600 text-black shadow-green-500/20'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-xs font-black uppercase tracking-wider">{toast.message}</span>
          </div>
        </div>
      )}
    </main>
  );
}