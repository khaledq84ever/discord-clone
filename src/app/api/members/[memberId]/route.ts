import { prisma } from "@/lib/prismadb";
import { getCurrentProfile } from "@/lib/query";
import { MemberRole } from "@/lib/prisma-enums";import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";


export async function PATCH(req: Request, props: { params: Promise<{ memberId: string }> }) {
    const params = await props.params;
    try {
		const profile = await getCurrentProfile();
        const {searchParams} = new URL(req.url);
        const {role, banned} = await req.json();
        const serverId = searchParams.get("serverId");
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
		if (!serverId) {
			return new NextResponse("Server not found", { status: 404 });
		}
        if (!params.memberId) {
            return new NextResponse("Member not found", { status: 404 });
        }

		const server = await prisma.server.update({
			where: {
				id: serverId,
				profileId: profile.id,
			},
			data: {
				members: {
                    update: {
                        where: {
                            id: params.memberId,
                            profileId:{ // To prevent the current login user to change their own role/ban state
                                not : profile.id
                            }
                        },
                        // Feature: ban/unban toggles `banned`; otherwise this is a role change.
                        data: banned !== undefined ? { banned: Boolean(banned) } : { role },
                    },
                },
			},
            include: {
                members: {
                    include: {
                        profile: true,
                    },
                    orderBy: {
                        role: "asc",
                    },
                },
            },
		});

		return NextResponse.json(server);
	} catch (error: any) {
		console.log(error, "MEMBER ID  API ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
export async function DELETE(req: Request, props: { params: Promise<{ memberId: string }> }) {
    const params = await props.params;
    try {
		const profile = await getCurrentProfile();
        const {searchParams} = new URL(req.url);
        const serverId = searchParams.get("serverId");
		if (!profile) {
			return new NextResponse("Unauthorized", { status: 401 });
		}
		if (!serverId) {
			return new NextResponse("Server not found", { status: 404 });
		}
        if (!params.memberId) {
            return new NextResponse("Member not found", { status: 404 });
        }

		const server = await prisma.server.update({
            where: {
                id: serverId,
                profileId: profile.id,
            },
            data: {
                members: {
                    deleteMany: {
                        id: params.memberId,
                        profileId: { // admin's can't kick themselves
                            not: profile.id,
                        },
                    },
                },
            },
            include: {
                members: {
                    include: {
                        profile: true,
                    },
                    orderBy: {
                        role: "asc",
                    },
                },
            },
        });

		return NextResponse.json(server);
	} catch (error: any) {
		console.log(error, "MEMBER ID  API ERROR");
		return new NextResponse("Internal Error", { status: 500 });
	}
}
