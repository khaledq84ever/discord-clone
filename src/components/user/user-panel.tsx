"use client";

import { ActionTooltip } from "@/components/ui/action-tooltip";
import { UserAvatar } from "@/components/user/user-avatar";
import { Profile } from "@/generated/prisma/client";
import { useStore } from "@/store/store";
import { Settings } from "lucide-react";

// Bottom of the channel list (like Discord): who you are, and a way into your settings.
export function UserPanel({ profile }: { profile: Profile }) {
	const onOpen = useStore.use.onOpen();
	const openSettings = () => onOpen("editProfile", { profile });

	return (
		<div className="mt-auto flex w-full items-center gap-x-2 bg-[#E3E5E8] dark:bg-[#232428] px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
			<button
				onClick={openSettings}
				className="flex min-w-0 flex-1 items-center gap-x-2 rounded-md px-1 py-1 text-left hover:bg-zinc-700/10 dark:hover:bg-zinc-700/50"
			>
				<UserAvatar src={profile.imageUrl ?? undefined} name={profile.name} className="h-8 w-8 md:h-8 md:w-8" />
				<span className="min-w-0">
					<span className="block truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">{profile.name}</span>
					<span className="block text-xs text-zinc-500 dark:text-zinc-400">Edit profile</span>
				</span>
			</button>
			<ActionTooltip label="User settings">
				<button
					onClick={openSettings}
					aria-label="User settings"
					className="rounded-md p-2 text-zinc-500 hover:bg-zinc-700/10 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-200"
				>
					<Settings className="h-5 w-5" />
				</button>
			</ActionTooltip>
		</div>
	);
}
