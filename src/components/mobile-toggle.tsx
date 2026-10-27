import { Menu } from "lucide-react";
import { MobileSheet } from "@/components/mobile-sheet";
import { SideBar } from "@/components/layout/side-bar";
import { ServerSideBar } from "@/components/layout/server-side-bar";

export function MobileToggle({ serverId }: { serverId: string }) {
	return (
		<MobileSheet
			side="left"
			label="Open navigation"
			icon={<Menu />}
			triggerClassName="md:hidden -ml-1 mr-1 shrink-0"
			// The overlay / swipe closes it; the default X would cover the server menu.
			className="w-[min(85vw,332px)] sm:max-w-none [&>button:last-child]:hidden"
		>
			<div className="w-[72px] shrink-0">
				<SideBar />
			</div>
			<div className="flex-1 min-w-0">
				<ServerSideBar serverId={serverId} />
			</div>
		</MobileSheet>
	);
}
