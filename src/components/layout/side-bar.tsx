
import { SideBarActions } from "@/components/layout/side-bar-actions";
import { SideBarItem } from "@/components/layout/side-bar-item";
import { ProfileButton } from "@/components/user/profile-button";
import { ModeToggle } from "@/components/mode-toggler";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAllServers, getCurrentProfile } from "@/lib/query";
import { redirect } from "next/navigation";


export  async function SideBar() {
	const profile = await getCurrentProfile();
	if (!profile) {
		return redirect("/sign-in");
	}

	const servers = await getAllServers(profile.id);

	return (
		<div className="flex flex-col space-y-4 items-center h-full text-primary w-full bg-[#E3E5E8] dark:bg-[#1E1F22] py-3">
			<SideBarActions />
			<Separator className="h-[2px] bg-zinc-300 dark:bg-zinc-700 rounded-md w-10 mx-auto" />
			<ScrollArea className="flex-1 w-full">
				{servers?.map((server) => (
					<div key={server.id} className="mb-4">
						<SideBarItem name={server.name} id={server.id} imageUrl={server.imageUrl} />
					</div>
				))}
			</ScrollArea>
			<div className="pb-[max(0.75rem,env(safe-area-inset-bottom))] mt-auto flex items-center flex-col gap-y-4">
				<ModeToggle />
				<ProfileButton profile={profile} />
			</div>
		</div>
	);
}
