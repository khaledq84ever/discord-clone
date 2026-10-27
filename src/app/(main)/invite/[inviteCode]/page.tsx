import { prisma } from "@/lib/prismadb";
import { getCurrentProfile, getServerByInviteCode } from "@/lib/query";

import { redirect } from "next/navigation";

export default async function InviteCodePage(props: { params: Promise<{ inviteCode: string }> }) {
    const params = await props.params;
    const profile = await getCurrentProfile();
        if (!profile) {
		// Come back to this invite after picking a username.
		return redirect(`/sign-in?redirect=${encodeURIComponent(`/invite/${params.inviteCode}`)}`);
	}
    if (!params.inviteCode) {
		return redirect("/");
	}
    const existingServer = await getServerByInviteCode(params.inviteCode, profile.id);

    if (existingServer) {
		return redirect(`/servers/${existingServer.id}`);
	}

    const server = await prisma.server.update({
		where: {
			inviteCode: params.inviteCode,
		},
		data: {
			members: {
				create: [
					{
						profileId: profile.id,
					},
				],
			},
		},
	});

    if (server) {
		return redirect(`/servers/${server.id}`);
	}
    return <div>page</div>;
}
