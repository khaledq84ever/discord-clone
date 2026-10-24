"use client";

import { ServerMember } from "@/components/server-member";
import { usePresence } from "@/contexts/presence-provider";
import { ServerWithMembersWithProfiles } from "@/types/server";

export function MemberList({ server }: { server: ServerWithMembersWithProfiles }) {
	const { onlineProfileIds } = usePresence();
	const sorted = [...server.members].sort((a, b) => {
		const aOnline = onlineProfileIds.has(a.profileId) ? 1 : 0;
		const bOnline = onlineProfileIds.has(b.profileId) ? 1 : 0;
		return bOnline - aOnline;
	});

	return (
		<div className="flex flex-col space-y-[2px]">
			{sorted.map((member) => (
				<ServerMember key={member.id} member={member} server={server} />
			))}
		</div>
	);
}
