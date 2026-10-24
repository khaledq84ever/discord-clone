"use client";

import { getLocalUserClient } from "@/lib/local-user-client";
import { useSocket } from "@/contexts/socket-provider";
import { createContext, useContext, useEffect, useState } from "react";

interface PresenceContextType {
	onlineProfileIds: Set<string>;
}

const PresenceContext = createContext<PresenceContextType>({ onlineProfileIds: new Set() });

export const usePresence = () => useContext(PresenceContext);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
	const { socket, isConnected } = useSocket();
	const [onlineProfileIds, setOnlineProfileIds] = useState<Set<string>>(new Set());

	useEffect(() => {
		if (!socket) return;

		const handleUpdate = (payload: { profileId: string; online: boolean }) => {
			setOnlineProfileIds((prev) => {
				const next = new Set(prev);
				if (payload.online) {
					next.add(payload.profileId);
				} else {
					next.delete(payload.profileId);
				}
				return next;
			});
		};

		socket.on("presence:update", handleUpdate);

		if (isConnected) {
			socket.emit("presence:join", { profileId: getLocalUserClient()?.id });
		}

		return () => {
			socket.off("presence:update", handleUpdate);
			setOnlineProfileIds(new Set());
		};
	}, [socket, isConnected]);

	return (
		<PresenceContext.Provider value={{ onlineProfileIds }}>{children}</PresenceContext.Provider>
	);
}
