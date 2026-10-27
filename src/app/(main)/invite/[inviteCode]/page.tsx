import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";

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

    // Look up the invite's server plus this profile's membership (if any),
    // so a banned member can't use the invite link to walk back in.
    const server = await prisma.server.findUnique({
		where: {
			inviteCode: params.inviteCode,
		},
		include: {
			members: {
				where: { profileId: profile.id },
			},
		},
	});

    if (!server) {
		return redirect("/");
	}

    const existingMembership = server.members[0];
    if (existingMembership) {
		if (existingMembership.banned) {
			// Banned: don't let them rejoin or re-enter.
			return redirect("/?error=banned");
		}
		return redirect(`/servers/${server.id}`);
	}

    await prisma.member.create({
		data: {
			profileId: profile.id,
			serverId: server.id,
		},
	});

    return redirect(`/servers/${server.id}`);
}
