import { ServerSideBar } from "@/components/layout/server-side-bar";
import { prisma } from "@/lib/prismadb";
import { getCurrentProfile, getServer } from "@/lib/query";

import { redirect } from "next/navigation";

export default async function ServerIdLayout(props: {children: React.ReactNode , params: Promise<{serverId: string}>}) {
    const params = await props.params;

    const {
        children
    } = props;

    const profile = await getCurrentProfile();
    if (!profile) {
        return redirect("/sign-in");
    }
    const server = await getServer(params.serverId, profile.id);
    if (!server) {
        return redirect("/");
    }
    return (
		<section className="h-full">
			<div className="hidden md:flex h-full w-60 z-20 flex-col fixed inset-y-0">
				<ServerSideBar serverId={params.serverId} />
			</div>
			<main className="h-full md:pl-60">{children}</main>
		</section>
	);
}
