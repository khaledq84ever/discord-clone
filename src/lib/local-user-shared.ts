export interface LocalUser {
	id: string;
	name: string;
	email: string;
	imageUrl: string | null;
}

export const LOCAL_USER_COOKIE = "local_user";

export function parseLocalUser(raw: string | undefined): LocalUser | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(decodeURIComponent(raw));
		if (!parsed?.id || !parsed?.name) return null;
		return {
			id: String(parsed.id),
			name: String(parsed.name).slice(0, 40),
			email: `${String(parsed.id).slice(0, 10)}@local.dev`,
			imageUrl: null,
		};
	} catch {
		return null;
	}
}