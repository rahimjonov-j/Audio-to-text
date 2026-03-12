import { Mic, MicOff } from 'lucide-react';

const stateLabels = {
  idle: 'Boshlash',
  recording: 'Tugatish',
  processing: 'Yuklanmoqda...',
  preview: 'Yangi buyurtma',
  error: `Qayta urinib ko'ring`
};

export default function MicButton({ state, onClick }) {
  const isProcessing = state === 'processing';
  const isRecording = state === 'recording';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isProcessing}
      aria-label={isRecording ? 'Ovozni toxtatish' : 'Ovozni yozib olish'}
      className={`button-ring group flex items-center gap-3 rounded-full px-6 py-3 text-base font-semibold transition ${
        isRecording
          ? 'bg-[var(--accent)] text-white shadow-[0_0_24px_rgba(217,107,43,0.45)]'
          : 'bg-[var(--surface)] text-[var(--text)]'
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
          isRecording ? 'border-white/60 bg-white/20' : 'border-[var(--accent)]/30 bg-[var(--surface-2)]'
        }`}
      >
        {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
      </span>
      {stateLabels[state]}
    </button>
  );
}
