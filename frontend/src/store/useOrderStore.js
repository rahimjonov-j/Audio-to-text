import { create } from 'zustand';

export const useOrderStore = create((set) => ({
  state: 'idle',
  transcription: '',
  parsedOrder: null,
  storedOrder: null,
  error: null,
  setState: (state) => set({ state }),
  setTranscription: (text) => set({ transcription: text }),
  setParsedOrder: (order) => set({ parsedOrder: order }),
  setStoredOrder: (order) => set({ storedOrder: order }),
  setError: (message) => set({ error: message }),
  reset: () =>
    set({
      state: 'idle',
      transcription: '',
      parsedOrder: null,
      storedOrder: null,
      error: null
    })
}));
