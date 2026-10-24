import { cookies } from "next/headers";
import type { NextApiRequest } from "next";
import { LOCAL_USER_COOKIE, parseLocalUser, type LocalUser } from "@/lib/local-user-shared";

export type { LocalUser };

export async function getLocalUser(): Promise<LocalUser | null> {
	const cookieStore = await cookies();
	return parseLocalUser(cookieStore.get(LOCAL_USER_COOKIE)?.value);
}

export function getLocalUserFromReq(req: NextApiRequest): LocalUser | null {
	const raw = req.cookies?.[LOCAL_USER_COOKIE];
	if (typeof raw !== "string") return null;
	return parseLocalUser(raw);
}