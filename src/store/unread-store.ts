import { create } from "zustand";

interface UnreadState {
	counts: Record<string, number>;
	inc: (chatId: string) => void;
	clear: (chatId: string) => void;
}

export const useUnreadStore = create<UnreadState>((set) => ({
	counts: {},
	inc: (chatId) =>
		set((state) => ({ counts: { ...state.counts, [chatId]: (state.counts[chatId] ?? 0) + 1 } })),
	clear: (chatId) =>
		set((state) => {
			if (!state.counts[chatId]) return state;
			const next = { ...state.counts };
			delete next[chatId];
			return { counts: next };
		}),
}));
