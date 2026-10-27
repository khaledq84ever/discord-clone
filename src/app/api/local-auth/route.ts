import { NextRequest, NextResponse } from "next/server";
import { LOCAL_USER_COOKIE } from "@/lib/local-user-shared";
import { prisma } from "@/lib/prismadb";
import crypto from "node:crypto";

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	const name = String(body?.name ?? "").trim();
	if (!name || name.length > 40) {
		return NextResponse.json({ error: "Enter a valid name (max 40 chars)" }, { status: 400 });
	}

		const user = {
		id: crypto.randomUUID(),
		name,
	};

	// Create the profile now: the (main) layout's sidebar reads it in parallel with the
	// page, so creating it lazily on "/" bounced first-time users back to /sign-in.
	await prisma.profile.create({
		data: { userId: user.id, name, email: `${user.id.slice(0, 10)}@local.dev`, imageUrl: null },
	});


	const res = NextResponse.json({ ok: true });
	res.cookies.set(LOCAL_USER_COOKIE, encodeURIComponent(JSON.stringify(user)), {
		path: "/",
		maxAge: 60 * 60 * 24 * 30,
		sameSite: "lax",
	});
	return res;
}

export async function DELETE(req: NextRequest) {
	const res = NextResponse.json({ ok: true });
	res.cookies.set(LOCAL_USER_COOKIE, "", { path: "/", maxAge: 0 });
	return res;
}