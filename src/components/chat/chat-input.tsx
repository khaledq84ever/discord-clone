"use client";

import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Smile, X, Reply } from "lucide-react";
import { useReplyStore } from "@/store/reply-store";
import { useForm } from "react-hook-form";
import z from "zod";
import axios from "axios";
import qs from "query-string";
import { useStore } from "@/store/store";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { useRouter } from "next/navigation";
import { getLocalUserClient } from "@/lib/local-user-client";
import { useSocket } from "@/contexts/socket-provider";
import { useEffect, useRef } from "react";
interface ChatInputProps {
	apiUrl: string;
	query: Record<string, any>;
	name: string;
	type: "conversation" | "channel";
}

const formSchema = z.object({
	content: z.string().min(1),
});
export function ChatInput({ apiUrl, query, name, type }: ChatInputProps) {
	const router = useRouter();
	const onOpen = useStore.use.onOpen();
	const { socket } = useSocket();
	const typingTimeout = useRef<NodeJS.Timeout | null>(null);
	const chatId = (type === "channel" ? query?.channelId : query?.conversationId) as string;
	const replyTarget = useReplyStore((s) => s.targets[chatId]);
	const clearReply = useReplyStore((s) => s.clear);

	const emitTyping = (started: boolean) => {
		if (!socket || !chatId) return;
		socket.emit(started ? "typing:start" : "typing:stop", { chatId, name: getLocalUserClient()?.name ?? "Someone" });
	};

	const handleTypingChange = (value: string) => {
		if (!typingTimeout.current) emitTyping(true);
		if (typingTimeout.current) clearTimeout(typingTimeout.current);
		typingTimeout.current = setTimeout(() => {
			emitTyping(false);
			typingTimeout.current = null;
		}, 2500);
	};

	useEffect(() => {
		return () => {
			emitTyping(false);
		};
	}, []);
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: "",
		},
	});
	const isLoading = form.formState.isSubmitting;
	const contentValue = form.watch("content");

	useEffect(() => {
		if (contentValue) {
			handleTypingChange(contentValue);
		} else {
			emitTyping(false);
		}
	}, [contentValue]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
            const url = qs.stringifyUrl({
                url: apiUrl,
                query
            });
            await axios.post(url, { ...values, replyToId: replyTarget?.id });
			form.reset();
			if (chatId) clearReply(chatId);
			router.refresh();
        } catch (error) {
            console.error(error);
        }
	};
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				{replyTarget && (
					<div className="mx-4 mt-2 flex items-center justify-between rounded-t-md bg-zinc-200/80 dark:bg-zinc-700/70 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-300">
						<span className="flex items-center gap-x-1 truncate">
							<Reply className="w-3 h-3 rotate-180 shrink-0" />
							Replying to <span className="font-semibold">{replyTarget.name}</span>
						</span>
						<button
							type="button"
							onClick={() => chatId && clearReply(chatId)}
							className="ml-2 hover:text-zinc-900 dark:hover:text-white"
						>
							<X className="w-4 h-4" />
						</button>
					</div>
				)}
				<FormField
					control={form.control}
					name="content"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="relative p-4 pb-6">
									<button
										type="button"
										onClick={() =>onOpen("messageFile", { apiUrl,query })}
										className="absolute top-7 left-8 h-[24px] w-[24px] bg-zinc-500 dark:bg-zinc-400 hover:bg-zinc-600 dark:hover:bg-zinc-300 transition rounded-full p-1 flex items-center justify-center"
									>
										<Plus className="text-white dark:text-[#313338]" />
									</button>
									<Input
										disabled={isLoading}
										className="px-14 py-6 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
										placeholder={`Message ${type === "conversation" ? name : "#" + name}`}
										{...field}
									/>
									<div className="absolute top-7 right-8">
										<EmojiPicker onChange={
											(value) => form.setValue("content", field.value + " " + value)
										} />
									</div>
								</div>
							</FormControl>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
