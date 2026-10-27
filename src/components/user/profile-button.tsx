"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { UserAvatar } from "@/components/user/user-avatar";
import { Profile } from "@/generated/prisma/client";
import { useStore } from "@/store/store";

export function ProfileButton({ profile }: { profile: Profile }) {
	const onOpen = useStore.use.onOpen();
	return (
		<ActionTooltip side="right" align="center" label="Edit profile">
			<button
				onClick={() => onOpen("editProfile", { profile })}
				aria-label="Edit profile"
				className="rounded-full transition hover:opacity-80"
			>
				<UserAvatar src={profile.imageUrl ?? undefined} name={profile.name} className="h-12 w-12 md:h-12 md:w-12" />
			</button>
		</ActionTooltip>
	);
}
