
import { SideBarActions } from "@/components/layout/side-bar-actions";
import { SideBarItem } from "@/components/layout/side-bar-item";
import { ModeToggle } from "@/components/mode-toggler";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { getAllServers, getCurrentProfile } from "@/lib/query";
import Image from "next/image";
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
			<div className="pb-3 mt-auto flex items-center flex-col gap-y-4">
				<ModeToggle />
				<div className="h-[48px] w-[48px] rounded-[24px] overflow-hidden">
					<Image
						src={profile.imageUrl || "/icon.png"}
						alt="avatar"
						width={48}
						height={48}
						className="h-[48px] w-[48px] object-cover"
					/>
				</div>
			</div>
		</div>
	);
}
