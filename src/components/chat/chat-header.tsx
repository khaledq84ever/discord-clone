import { ChatVideoButton } from "@/components/chat/chat-video-button";
import { MobileToggle } from "@/components/mobile-toggle";
import { SocketIndicator } from "@/components/socket-indicator";
import { UserAvatar } from "@/components/user/user-avatar";
import { Hash } from "lucide-react";
interface ChatHeaderProps {
	name: string;
	type: "conversation" | "channel";
	imageUrl?: string;
	serverId: string;
	actions?: React.ReactNode;
}

export function ChatHeader({ name, type, imageUrl, serverId, actions }: ChatHeaderProps) {
	return (
		<div className="text-md font-semibold px-3 flex items-center gap-x-1 h-12 shrink-0 border-neutral-200 dark:border-neutral-800 border-b-2">
			<MobileToggle serverId={serverId} />
			{type === "channel" && <Hash className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400 mr-1" />}
			{type === "conversation" && <UserAvatar src={imageUrl} name={name} className="h-8 w-8 md:h-8 md:w-8 mr-1 shrink-0" />}
			<p className="text-md font-semibold text-black dark:text-white truncate min-w-0">{name}</p>
			<div className="ml-auto flex items-center gap-x-1 shrink-0">
				{actions}
				{type === "conversation" && <ChatVideoButton />}
				<SocketIndicator />
			</div>
		</div>
	);
}
