"use client";

import { LOCAL_USER_COOKIE, parseLocalUser, type LocalUser } from "@/lib/local-user-shared";

export function getLocalUserClient(): LocalUser | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie
		.split("; ")
		.find((c) => c.startsWith(`${LOCAL_USER_COOKIE}=`));
	if (!match) return null;
	return parseLocalUser(match.slice(LOCAL_USER_COOKIE.length + 1));
}