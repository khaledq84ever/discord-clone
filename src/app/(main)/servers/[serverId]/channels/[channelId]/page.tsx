import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { MediaRoom } from "@/components/media-room";
import { getChannel, getCurrentProfile,getGeneralServer, getMember, getServer } from "@/lib/query";
import { cn } from "@/lib/utils";

import { ChannelType } from "@/lib/prisma-enums";
import { redirect } from "next/navigation";
import { MemberList } from "@/components/member-list";
import { ServerSection } from "@/components/server-section";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MobileSheet } from "@/components/mobile-sheet";
import { Users } from "lucide-react";


interface ChannelIdPageProps {
	params: Promise<{
		serverId: string;
		channelId: string;
	}>;
}

export default async function ChannelIdPage(props: ChannelIdPageProps) {
    const params = await props.params;
    const profile = await getCurrentProfile();
    if (!profile) {
		return redirect("/sign-in");
	}


    const channel = await getChannel(params.channelId);
    const member = await getMember(params.serverId, profile.id);
    const server = await getServer(params.serverId, profile.id);

    if (!channel || !member || !server) {
		return redirect("/");
	}
    const otherMembers = server.members.filter((m) => m.profileId !== profile.id);
    const isText = channel.type === ChannelType.TEXT;
    const membersPanel = (
		<>
			<ServerSection
				sectionType="members"
				role={member.role}
				server={server}
				label={`Members — ${server.members.length}`}
			/>
			<ScrollArea className="flex-1">
				<div className="px-2 pb-3">
					<MemberList server={{ ...server, members: otherMembers } as any} />
				</div>
			</ScrollArea>
		</>
	);
    return (
		<div className="flex h-full">
		<div
			className={cn(
				"bg-white dark:bg-[#313338] flex flex-col flex-1 min-w-0",
				(channel.type === ChannelType.VIDEO || channel.type === ChannelType.AUDIO) && "overflow-hidden"
			)}
		>
			<ChatHeader
				name={channel?.name}
				serverId={channel?.serverId}
				type="channel"
				actions={
					isText && (
						<MobileSheet
							side="right"
							label="Show members"
							icon={<Users className="w-5 h-5" />}
							triggerClassName="lg:hidden"
							className="w-[min(85vw,280px)] sm:max-w-none flex-col bg-[#F2F3F5] dark:bg-[#2B2D31] pt-10"
						>
							{membersPanel}
						</MobileSheet>
					)
				}
			/>
			{channel.type === ChannelType.TEXT && (
				<>
					<ChatMessages
						chatId={channel.id}
						member={member}
						name={channel.name}
						type="channel"
						apiUrl="/api/messages"
						socketUrl="/api/socket/messages"
						socketQuery={{
							channelId: channel.id,
							serverId: channel.serverId,
						}}
						paramKey="channelId"
						paramValue={channel.id}
					/>
					<ChatInput
						name={channel.name}
						type="channel"
						apiUrl="/api/socket/messages"
						query={{
							channelId: channel.id,
							serverId: channel.serverId,
						}}
					/>
				</>
			)}
			{channel.type === ChannelType.AUDIO && (
				<MediaRoom chatId={channel.id} serverId={params.serverId} video={false} audio={true} />
			)}
			{channel.type === ChannelType.VIDEO && (
				<MediaRoom chatId={channel.id} serverId={params.serverId} video={true} audio={true} />
			)}
		</div>
		{isText && (
			<div className="hidden lg:flex w-60 h-full flex-col bg-[#F2F3F5] dark:bg-[#2B2D31] shrink-0">
				{membersPanel}
			</div>
		)}
		</div>
	);
}
