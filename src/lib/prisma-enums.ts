export const ChannelType = {
	TEXT: "TEXT",
	AUDIO: "AUDIO",
	VIDEO: "VIDEO",
} as const;
export type ChannelType = string;

export const MemberRole = {
	MODERATOR: "MODERATOR",
	GUEST: "GUEST",
	ADMIN: "ADMIN",
} as const;
export type MemberRole = string;