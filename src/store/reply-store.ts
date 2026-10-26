import { create } from "zustand";

export interface ReplyTarget {
	id: string;
	name: string;
	content: string;
}

interface ReplyState {
	// keyed by chatId (channelId / conversationId) so each chat has its own target
	targets: Record<string, ReplyTarget | null>;
	setReply: (chatId: string, target: ReplyTarget | null) => void;
	clear: (chatId: string) => void;
}

export const useReplyStore = create<ReplyState>((set) => ({
	targets: {},
	setReply: (chatId, target) =>
		set((s) => ({ targets: { ...s.targets, [chatId]: target } })),
	clear: (chatId) => set((s) => ({ targets: { ...s.targets, [chatId]: null } })),
}));
