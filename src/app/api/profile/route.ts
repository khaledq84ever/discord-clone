import { prisma } from "@/lib/prismadb";
import { LOCAL_USER_COOKIE } from "@/lib/local-user-shared";
import { getLocalUser } from "@/lib/mock-user";
import { getCurrentProfile } from "@/lib/query";
import { NextResponse } from "next/server";

// Only accept avatars stored by /api/upload, so a profile can't point at arbitrary URLs.
const UPLOADED_IMAGE = /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|gif|webp|avif)$/;

export async function PATCH(req: Request) {
	try {
		const profile = await getCurrentProfile();
		const user = await getLocalUser();
		if (!profile || !user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json().catch(() => ({}));
		const data: { name?: string; imageUrl?: string | null } = {};

		if (body.name !== undefined) {
			const name = String(body.name).trim();
			if (!name || name.length > 40) {
				return NextResponse.json({ error: "Name must be 1–40 characters" }, { status: 400 });
			}
			data.name = name;
		}
		if (body.imageUrl !== undefined) {
			const imageUrl = body.imageUrl ? String(body.imageUrl) : null;
			if (imageUrl && !UPLOADED_IMAGE.test(imageUrl)) {
				return NextResponse.json({ error: "Invalid image" }, { status: 400 });
			}
			data.imageUrl = imageUrl;
		}

		const updated = await prisma.profile.update({ where: { id: profile.id }, data });

		const res = NextResponse.json(updated);
		// The cookie carries the display name used client-side (typing indicator, voice rooms).
		if (data.name) {
			res.cookies.set(LOCAL_USER_COOKIE, encodeURIComponent(JSON.stringify({ id: user.id, name: data.name })), {
				path: "/",
				maxAge: 60 * 60 * 24 * 30,
				sameSite: "lax",
			});
		}
		return res;
	} catch (error) {
		console.error("[PROFILE_PATCH]", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
