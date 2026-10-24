"use client";

import { getLocalUserClient } from "@/lib/local-user-client";

function Row({ desc, value, children }: { desc: string; value: string; children: React.ReactNode }) {
	return (
		<div className="h-[2.125rem] grid grid-cols-2 items-center relative">
			<span className="text-xs font-semibold block flex-shrink-0">{desc}</span>
			<span className="text-xs text-[#7D7D7E] font-mono block relative">
				<span className="block truncate w-full">{value}</span>
				{children}
			</span>
		</div>
	);
}

function PointerC({ label }: { label: string }) {
	return (
		<div className="absolute w-fit flex items-center gap-5 top-1/2 -translate-y-1/2 left-full">
			<div className="relative">
				<div className="h-px bg-[#BFBFC4] w-[6.5rem]" />
				<div className="size-1 bg-[#BFBFC4] rotate-45 absolute right-0 top-1/2 -translate-y-1/2" />
			</div>
			<div className="font-mono text-xs bg-black px-1.5 py-1 rounded-md text-white">{label}</div>
		</div>
	);
}

function formatDate(date: Date) {
	return date.toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

function formatDateWithNumbers(date: Date): string {
	return date.toLocaleString("en-US", {
		month: "numeric",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		second: "2-digit",
		hour12: true,
	});
}

export function UserDetails() {
	const user = getLocalUserClient() ?? {
		id: "unknown",
		name: "Unknown",
		email: "unknown@local.dev",
		imageUrl: "/icon.png" as string | null,
		createdAt: new Date(),
		lastSignInAt: new Date(),
	};
	const displayUser = {
		...user,
		createdAt: (user as any).createdAt ?? new Date(),
		lastSignInAt: (user as any).lastSignInAt ?? new Date(),
		imageUrl: user.imageUrl ?? "/icon.png",
	};
	const session = {
		id: "sess_local_tester",
		status: "active",
		lastActiveAt: new Date(),
		expireAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
	};
	const organization = null as unknown as
		| {
				id: string;
				name: string;
				membersCount: number;
				pendingInvitationsCount: number;
		  }
		| null;

	return (
		<div className="p-16 rounded-lg border border-[#EDEDED] bg-[#F1F1F2] background relative">
			<div className="p-8 rounded-xl bg-white shadow-[0_5px_15px_rgba(0,0,0,0.08),0_15px_35px_-5px_rgba(25,28,33,0.2)] ring-1 ring-gray-950/5 max-w-[25rem]">
				<div className="flex flex-col items-center gap-2 mb-6">
					<div className="w-full relative flex justify-center">
						<img src={displayUser.imageUrl} className="size-20 rounded-full" />
						<div className="absolute w-fit flex items-center gap-5 top-1/2 -translate-x-2.5 -translate-y-1/2 left-full">
							<div className="relative">
								<div className="h-px bg-[#BFBFC4] w-[6.5rem]" />
								<div className="size-1 bg-[#BFBFC4] rotate-45 absolute right-0 top-1/2 -translate-y-1/2" />
							</div>
							<div className="font-mono text-xs bg-black px-1.5 py-1 rounded-md text-white">
								user.imageUrl
							</div>
						</div>
					</div>
					<h1 className="text-[1.0625rem] font-semibold relative w-full text-center">
						{user.name}
						<div className="absolute w-fit flex items-center gap-5 top-1/2 -translate-x-2.5 -translate-y-1/2 left-full">
							<div className="relative">
								<div className="h-px bg-[#BFBFC4] w-[6.5rem]" />
								<div className="size-1 bg-[#BFBFC4] rotate-45 absolute right-0 top-1/2 -translate-y-1/2" />
							</div>
							<div className="font-mono text-xs bg-black px-1.5 py-1 rounded-md text-white">
								user.name
							</div>
						</div>
					</h1>
				</div>

				<div className="px-2.5 bg-[#FAFAFB] rounded-lg divide-y divide-[#EEEEF0]">
					<Row desc="Email" value={user.email}>
						<PointerC label="user.email" />
					</Row>
					<Row desc="Last signed in" value={formatDate(displayUser.lastSignInAt)}>
						<PointerC label="user.lastSignInAt" />
					</Row>
					<Row desc="Joined on" value={formatDate(displayUser.createdAt)}>
						<PointerC label="user.createdAt" />
					</Row>
					<Row desc="User ID" value={user.id}>
						<PointerC label="user.user.id" />
					</Row>
				</div>
				<h2 className="mt-6 mb-4 text-[0.9375rem] font-semibold">Session details</h2>
				<div className="px-2.5 bg-[#FAFAFB] rounded-lg divide-y divide-[#EEEEF0]">
					<Row desc="Session ID" value={session.id}>
						<PointerC label="session.id" />
					</Row>
					<Row desc="Status" value={session.status}>
						<PointerC label="session.status" />
					</Row>
					<Row desc="Last active" value={formatDateWithNumbers(session.lastActiveAt)}>
						<PointerC label="session.lastActiveAt" />
					</Row>
					<Row desc="Session expiration" value={formatDateWithNumbers(session.expireAt)}>
						<PointerC label="session.expireAt" />
					</Row>
				</div>
				{organization ? (
					<>
						<h2 className="mt-6 mb-4 text-[0.9375rem] font-semibold">Organization detail</h2>
						<div className="px-2.5 bg-[#FAFAFB] rounded-lg divide-y divide-[#EEEEF0]">
							<Row desc="Organization ID" value={organization.id}>
								<PointerC label="organization.id" />
							</Row>
							<Row desc="Name" value={organization.name}>
								<PointerC label="organization.name" />
							</Row>
							<Row desc="Members" value={String(organization.membersCount)}>
								<PointerC label="organization.membersCount" />
							</Row>
							<Row desc="Pending invitations" value={String(organization.pendingInvitationsCount)}>
								<PointerC label="organization.pendingInvitationsCount" />
							</Row>
						</div>
					</>
				) : null}
			</div>
		</div>
	);
}
