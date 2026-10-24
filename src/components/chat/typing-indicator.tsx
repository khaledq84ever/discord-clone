"use client";

import { useSocket } from "@/contexts/socket-provider";
import { useEffect, useState } from "react";

export function TypingIndicator({ chatId }: { chatId: string }) {
	const { socket } = useSocket();
	const [activeUsers, setActiveUsers] = useState<string[]>([]);

	useEffect(() => {
		if (!socket) return;
		const started = (payload: { chatId: string; name: string }) => {
			if (payload.chatId !== chatId) return;
			setActiveUsers((prev) => (prev.includes(payload.name) ? prev : [...prev, payload.name]));
		};
		const stopped = (payload: { chatId: string; name: string }) => {
			if (payload.chatId !== chatId) return;
			setActiveUsers((prev) => prev.filter((n) => n !== payload.name));
		};
		socket.on("typing:start", started);
		socket.on("typing:stop", stopped);
		return () => {
			socket.off("typing:start", started);
			socket.off("typing:stop", stopped);
		};
	}, [socket, chatId]);

	if (activeUsers.length === 0) return null;

	return (
		<div className="px-4 py-1 text-xs text-zinc-500 dark:text-zinc-400 italic">
			{activeUsers.join(", ")} {activeUsers.length > 1 ? "are" : "is"} typing…
		</div>
	);
}
