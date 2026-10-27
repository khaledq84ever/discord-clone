"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user/user-avatar";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store";
import { zodResolver } from "@hookform/resolvers/zod";
import { Member, Profile } from "@/generated/prisma/client";
import { MemberRole } from "@/lib/prisma-enums";import axios from "axios";
import { Edit, FileText, Pin, PinOff, Reply, ShieldAlert, ShieldCheck, SmilePlus, Trash } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReplyStore } from "@/store/reply-store";
import { useActiveMessage } from "@/store/active-message-store";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import qs from "query-string";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

interface ChatItemProps {
	id: string;
	content: string;
	member: Member & { profile: Profile };
	timestamp: string;
	fileUrl: string | null;
	deleted: boolean;
	currentMember: Member;
	isUpdated: boolean;
	socketUrl: string;
	socketQuery: Record<string, string>;
	reactions: { id: string; emoji: string; memberId: string; member: Member & { profile: Profile } }[];
	pinned?: boolean;
	replyTo?: { id: string; content: string; deleted: boolean; member: Member & { profile: Profile } } | null;
}

const roleIconMap: Record<string, React.ReactNode | null> = {
	GUEST: null,
	ADMIN: <ShieldAlert className="w-4 h-4 ml-2 text-rose-500" />,
	MODERATOR: <ShieldCheck className="w-4 ml-2 h-4 text-indigo-500" />,
};

const formSchema = z.object({
	content: z.string().min(1),
});

export function ChatItem({
	id,
	content,
	member,
	timestamp,
	fileUrl,
	deleted,
	currentMember,
	isUpdated,
	socketUrl,
	socketQuery,
	reactions: initialReactions,
	pinned = false,
	replyTo = null,
}: ChatItemProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [reactions, setReactions] = useState(initialReactions);
	const setReply = useReplyStore((s) => s.setReply);
	const chatId = socketQuery.channelId;
	const isActive = useActiveMessage((s) => s.id === id);
	const toggleActive = useActiveMessage((s) => s.toggle);
	const clearActive = useActiveMessage((s) => s.clear);

	useEffect(() => {
		setReactions(initialReactions);
	}, [initialReactions]);
	const onOpen = useStore.use.onOpen();
	const router = useRouter();
	const params = useParams();

	const isAdmin = currentMember.role === MemberRole.ADMIN;
	const isModerator = currentMember.role === MemberRole.MODERATOR;
	const isOwner = currentMember.id === member.id;
	const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
	const canEditMessage = !deleted && isOwner && !fileUrl;
	const canPinMessage = !deleted && (isAdmin || isModerator || isOwner);
	const isPDF = fileUrl?.endsWith(".pdf") && fileUrl;
	const isImage = fileUrl && !isPDF;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			content: content,
		},
	});

	useEffect(() => {
		form.reset({
			content: content,
		});
	}, [content, form]);

	useEffect(() => {
		const handleKeyDown = (event: any) => {
			if (event.key === "Escape" || event.keyCode === 27) {
				setIsEditing(false);
			}
		};
		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const isLoading = form.formState.isSubmitting;

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			const url = qs.stringifyUrl({
				url: `${socketUrl}/${id}`,
				query: socketQuery,
			});
			await axios.patch(url, values);
			form.reset();
			setIsEditing(false);
			// router.refresh();
		} catch (error) {
			console.error(error);
		}
	};

	const toggleReaction = async (emoji: string) => {
		const prev = reactions;
		const existing = reactions.find((r) => r.memberId === currentMember.id && r.emoji === emoji);
		if (existing) {
			setReactions(reactions.filter((r) => r.id !== existing.id));
		} else {
			setReactions([
				...reactions,
				{ id: `tmp-${Date.now()}`, emoji, memberId: currentMember.id, member: currentMember as any },
			]);
		}
		try {
			const url = qs.stringifyUrl({ url: `${socketUrl}/${id}`, query: socketQuery });
			await axios.put(url, { emoji });
		} catch (error) {
			console.error(error);
			setReactions(prev);
		}
	};

	const onPinToggle = async () => {
		try {
			const url = qs.stringifyUrl({ url: `${socketUrl}/${id}`, query: socketQuery });
			await axios.patch(url, { pinned: !pinned });
		} catch (error) {
			console.error(error);
		}
	};

	const onReply = () => {
		clearActive();
		if (!chatId) return;
		setReply(chatId, {
			id,
			name: member.profile.name,
			content: deleted ? "message" : content,
		});
	};

	const groupedReactions = Object.values(
		reactions.reduce<Record<string, { emoji: string; count: number; mine: boolean }>>((acc, r) => {
			acc[r.emoji] = acc[r.emoji] || { emoji: r.emoji, count: 0, mine: false };
			acc[r.emoji].count += 1;
			if (r.memberId === currentMember.id) acc[r.emoji].mine = true;
			return acc;
		}, {})
	);

	const onMemberClick = () => {
		if(member?.id === currentMember.id) return;
		router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
	}

	return (
		<div
			onClick={(e) => {
				// Only plain taps on the message body; links, buttons and inputs keep their own behaviour.
				if ((e.target as HTMLElement).closest("a,button,input,textarea,svg,[role=dialog]")) return;
				toggleActive(id);
			}}
			className={cn(
				"relative group flex items-center hover:bg-black/5 px-3 py-2 md:p-4 transition w-full",
				isActive && "bg-black/5 dark:bg-white/5"
			)}
		>
			<div className="group flex gap-x-2 items-start w-full">
				<div onClick={onMemberClick} className="transition cursor-pointer hover:drop-shadow-md">
					<UserAvatar src={member.profile.imageUrl ?? undefined} name={member.profile.name} />
				</div>
				<div className="flex flex-col w-full min-w-0">
					{replyTo && (
						<div className="flex items-center gap-x-1 mb-1 text-xs text-zinc-500 dark:text-zinc-400">
							<Reply className="w-3 h-3 rotate-180 shrink-0" />
							<span className="font-semibold">{replyTo.member?.profile?.name}</span>
							<span className="truncate max-w-[55vw] md:max-w-[320px] opacity-80">
								{replyTo.deleted ? "message was deleted" : replyTo.content}
							</span>
						</div>
					)}
					{pinned && (
						<div className="flex items-center gap-x-1 mb-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
							<Pin className="w-3 h-3" /> Pinned
						</div>
					)}
					<div className="flex items-center gap-x-2 min-w-0">
							<div className="flex items-center min-w-0">
							<p onClick={onMemberClick} className="font-semibold text-sm hover:underline cursor-pointer truncate">
								{member.profile.name}
							</p>
							<ActionTooltip label={member.role}>{roleIconMap[member.role]}</ActionTooltip>
						</div>
						<span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">{timestamp}</span>
					</div>
					{isImage && (
						<a
							href={fileUrl}
							target="_blank"
							rel="noreferrer noopener"
							className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-40 w-40 md:h-48 md:w-48"
						>
							<Image src={fileUrl} alt={content} fill className="object-cover" />
						</a>
					)}
					{isPDF && (
						<a
							href={fileUrl}
							target="_blank"
							rel="noreferrer noopener"
							className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-40 w-40 md:h-48 md:w-48"
						>
							<FileText className="w-12 h-12 text-zinc-500 dark:text-zinc-400 m-auto" />
						</a>
					)}
					{!fileUrl && !isEditing && (
						<div
							className={cn(
								"text-sm text-zinc-600 dark:text-zinc-300",
								deleted && "italic text-zinc-500 dark:text-zinc-400 text-xs mt-1"
							)}
						>
							{deleted ? (
								content
							) : (
								<div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:my-0 prose-pre:my-1 prose-pre:bg-zinc-200/70 dark:prose-pre:bg-zinc-900/60 prose-code:text-indigo-500 dark:prose-code:text-indigo-300">
									<ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
								</div>
							)}
							{isUpdated && !deleted && (
								<span className="text-[10px] text-zinc-500 dark:text-zinc-400 ">(edited)</span>
							)}
						</div>
					)}
					{groupedReactions.length > 0 && (
						<div className="flex flex-wrap items-center gap-1.5 mt-1.5">
							{groupedReactions.map((r) => (
								<button
									key={r.emoji}
									onClick={() => toggleReaction(r.emoji)}
									className={cn(
										"flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition",
										r.mine
											? "bg-indigo-500/20 border-indigo-500/50 text-indigo-500 dark:text-indigo-300"
											: "bg-zinc-100 border-zinc-300 dark:bg-zinc-700/60 dark:border-zinc-600 hover:border-zinc-400"
									)}
								>
									<span>{r.emoji}</span>
									<span className="font-semibold">{r.count}</span>
								</button>
							))}
						</div>
					)}
					{!fileUrl && isEditing && (
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex items-center w-full gap-x-2 pt-2"
							>
								<FormField
									control={form.control}
									name="content"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormControl>
												<div className="relative w-full">
													<Input
														disabled={isLoading}
														className="p-2 bg-zinc-200/90 dark:bg-zinc-700/75 border-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-zinc-600 dark:text-zinc-200"
														placeholder="Edited Message"
														{...field}
													/>
												</div>
											</FormControl>
										</FormItem>
									)}
								/>
								<Button disabled={isLoading} size="sm" variant="primary">
									Save
								</Button>
							</form>
							<span className="mt-1 text-[10px] text-zinc-400 hidden md:inline">
								Press escape to cancel , enter to save
							</span>
							<button
								type="button"
								onClick={() => setIsEditing(false)}
								className="mt-1 text-xs text-zinc-500 underline md:hidden"
							>
								Cancel
							</button>
						</Form>
					)}
				</div>
			</div>
			<div
				className={cn(
					"hidden group-hover:flex items-center gap-x-4 md:gap-x-2 absolute px-3 py-2 md:p-1 -top-4 md:-top-2 right-2 md:right-5 bg-white dark:bg-zinc-800 border rounded-md md:rounded-sm shadow-sm z-10 [&_svg]:w-5 [&_svg]:h-5 md:[&_svg]:w-4 md:[&_svg]:h-4",
					isActive && "flex"
				)}
			>
				{!deleted && (
					<ActionTooltip label="Reply">
						<Reply
							onClick={onReply}
							className="cursor-pointer w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
						/>
					</ActionTooltip>
				)}
				{canPinMessage && (
					<ActionTooltip label={pinned ? "Unpin" : "Pin"}>
						{pinned ? (
							<PinOff
								onClick={onPinToggle}
								className="cursor-pointer w-4 h-4 text-amber-600 dark:text-amber-400 transition"
							/>
						) : (
							<Pin
								onClick={onPinToggle}
								className="cursor-pointer w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
							/>
						)}
					</ActionTooltip>
				)}
				{!deleted && (
					<ActionTooltip label="Add Reaction">
						<div className="cursor-pointer h-5 w-5 flex items-center justify-center">
							<EmojiPicker onChange={(emoji) => toggleReaction(emoji)} />
						</div>
					</ActionTooltip>
				)}
				{canEditMessage && (
					<ActionTooltip label="Edit">
						<Edit
							onClick={() => {
								clearActive();
								setIsEditing(true);
							}}
							className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
						/>
					</ActionTooltip>
				)}
				{canDeleteMessage && (
					<ActionTooltip label="Delete">
						<Trash
							onClick={() => {
								clearActive();
								onOpen("deleteMessage", { apiUrl: `${socketUrl}/${id}`, query: socketQuery });
							}}
							className="cursor-pointer ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
						/>
					</ActionTooltip>
				)}
			</div>
		</div>
	);
}
