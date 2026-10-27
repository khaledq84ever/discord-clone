import { create } from "zustand";

// Touch screens have no hover, so tapping a message selects it to reveal its actions.
interface ActiveMessageState {
	id: string | null;
	toggle: (id: string) => void;
	clear: () => void;
}

export const useActiveMessage = create<ActiveMessageState>((set) => ({
	id: null,
	toggle: (id) => set((s) => ({ id: s.id === id ? null : id })),
	clear: () => set({ id: null }),
}));
