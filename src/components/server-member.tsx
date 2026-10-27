"use client"

import { UserAvatar } from '@/components/user/user-avatar';
import { cn } from '@/lib/utils';
import { Member, Profile, Server } from '@/generated/prisma/client';
import { MemberRole } from '@/lib/prisma-enums';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { usePresence } from '@/contexts/presence-provider';
import React from 'react'

interface ServerMemberProps {
    member: Member & {profile : Profile };
    server : Server ;
    }

const roleIconMap: Record<string, React.ReactNode | null> = {
	[MemberRole.GUEST]: null,
	[MemberRole.ADMIN]: <ShieldAlert className="text-rose-500 ml-2 h-4 w-4" />,
	[MemberRole.MODERATOR]: <ShieldCheck className="text-indigo-500 ml-2 h-4 w-4" />,
};

export  function ServerMember({ member, server }: ServerMemberProps) {
    const params = useParams()
    const router = useRouter()
    const { onlineProfileIds } = usePresence();
    const isOnline = onlineProfileIds.has(member.profileId);

    const icon = roleIconMap[member.role];
	const onClick = () => {
		router.push(`/servers/${params?.serverId}/conversations/${member.id}`);
	};
	return (
		<button
			onClick={onClick}
			className={cn(
				"group px-2 py-2 rounded-md flex items-center gap-x-2 w-full hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50 transition mb-1",
				params?.memberId === member.id && "bg-zinc-700/10 dark:bg-zinc-700"
			)}
		>
			<div className="relative">
			<UserAvatar src={member?.profile?.imageUrl ?? undefined} name={member?.profile?.name} className="h-8 w-8 md:h-8 md:w-8" />
			<span
				className={cn(
					"absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-[#2B2D31]",
					isOnline ? "bg-emerald-500" : "bg-zinc-400"
				)}
			/>
		</div>
			<p
				className={cn(
					"font-semibold text-sm text-zinc-500 group-hover:text-zinc-600 dark:text-zinc-400 dark:group-hover:text-zinc-300 transition",
					params?.memberId === member.id && "text-primary dark:text-zinc-200 dark:group-hover:text-white"
				)}
			>
				{member.profile?.name}
			</p>
			{icon}
		</button>
	);
}
