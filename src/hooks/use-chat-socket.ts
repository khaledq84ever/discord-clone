import { useSocket } from "@/contexts/socket-provider";
import { Member, Message, Profile } from "@/generated/prisma/client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUnreadStore } from "@/store/unread-store";

type ChatSocketProps = {
	addKey: string;
	updateKey: string;
	queryKey: string;
	chatId?: string;
};

type MessageWithMemberWithProfile = Message & { member: Member & { profile: Profile } };

export const useChatSocket = ({ addKey, updateKey, queryKey, chatId }: ChatSocketProps) => {

	const { socket } = useSocket();
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!socket) return;
		socket?.on(updateKey, (message: MessageWithMemberWithProfile) => {
			queryClient.setQueryData([queryKey], (oldData: any) => {
				if (!oldData || !oldData.pages || oldData.pages.length === 0) return oldData;
				const newData = oldData.pages.map((page: any) => {
					return {
						...page,
						items: page.items.map((item: MessageWithMemberWithProfile) => {
							if (item.id === message.id) return message;
							return item;
						}),
					};
				});
				return { ...oldData, pages: newData };
			});
		});
		socket?.on(addKey, (message: MessageWithMemberWithProfile) => {
			if (chatId && !window.location.pathname.includes(chatId)) {
				useUnreadStore.getState().inc(chatId);
			}
			queryClient.setQueryData([queryKey], (oldData: any) => {
				if (!oldData || !oldData.pages || oldData.pages.length === 0) {
					return {
						pages: [
							{
								items: [message],
							},
						],
					};
				}
				// Pages are newest-first (the list renders reversed), so new messages go in front.
				// Skip it if a poll already brought it in.
				const exists = oldData.pages.some((page: any) =>
					page.items.some((item: MessageWithMemberWithProfile) => item.id === message.id)
				);
				if (exists) return oldData;
				const newData = [...oldData.pages];
				newData[0] = {
					...newData[0],
					items: [message, ...newData[0].items],
				};
				return { ...oldData, pages: newData };
			});
		});
		return () => {
			socket.off(updateKey);
			socket.off(addKey);
		};
	}, [socket, updateKey, addKey, queryClient, queryKey]);

	return {
		socket,
	};
};
