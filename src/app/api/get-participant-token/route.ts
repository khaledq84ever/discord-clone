import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";

// Issues a LiveKit token for a voice/video room. Rooms are channel ids or DM
// conversation ids; the caller must be signed in and belong to that channel's server
// or that conversation. Identity is the profile id so two users with the same display
// name don't kick each other out of the room.
export async function GET(req: NextRequest) {
	const room = req.nextUrl.searchParams.get("room");
	if (!room) {
		return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
	}

	const apiKey = process.env.LIVEKIT_API_KEY;
	const apiSecret = process.env.LIVEKIT_API_SECRET;
	if (!apiKey || !apiSecret) {
		return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
	}

	const profile = await getCurrentProfile();
	if (!profile) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const [channel, conversation] = await Promise.all([
		prisma.channel.findFirst({
			where: { id: room, server: { members: { some: { profileId: profile.id, banned: false } } } },
			select: { id: true },
		}),
		prisma.conversation.findFirst({
			where: {
				id: room,
				OR: [{ memberOne: { profileId: profile.id } }, { memberTwo: { profileId: profile.id } }],
			},
			select: { id: true },
		}),
	]);
	if (!channel && !conversation) {
		return NextResponse.json({ error: "Room not found" }, { status: 404 });
	}

	const at = new AccessToken(apiKey, apiSecret, {
		identity: profile.id,
		name: profile.name,
		metadata: JSON.stringify({ imageUrl: profile.imageUrl }),
	});
	at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

	return NextResponse.json({ token: await at.toJwt() });
}
