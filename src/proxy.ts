import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCAL_USER_COOKIE } from "@/lib/local-user-shared";

// Logged-out visitors opening an invite link are sent to sign-in with a way back.
// (The page can't do this itself: the (main) layout's sidebar redirects to a bare
// /sign-in first.)
export function proxy(request: NextRequest) {
	if (request.cookies.has(LOCAL_USER_COOKIE)) return NextResponse.next();
	const url = new URL("/sign-in", request.url);
	url.searchParams.set("redirect", request.nextUrl.pathname);
	return NextResponse.redirect(url);
}

export const config = {
	matcher: "/invite/:path*",
};
