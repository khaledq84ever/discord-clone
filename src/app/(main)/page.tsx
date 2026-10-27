import { ModeToggle } from "@/components/mode-toggler";
import { InitialModel } from "@/components/modals/initial-model";
import { ProfileButton } from "@/components/user/profile-button";
import { getFirstServer, initProfile } from "@/lib/query";

// Landing page after sign-in. Users who already belong to a server are redirected
// by getFirstServer; everyone else is asked to create their first server.
export default async function Home() {
	const profile = await initProfile();
	await getFirstServer(profile.id);

	return (
		<main className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
			<div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))]">
				<ModeToggle />
			</div>
			<ProfileButton profile={profile} />
			<h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Welcome, {profile.name}</h1>
			<p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
				Create your first server to start chatting, or open an invite link from a friend.
			</p>
			<InitialModel />
		</main>
	);
}
