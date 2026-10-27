import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/server";
import { getCurrentProfilePage } from "@/lib/query";
import { prisma } from "@/lib/prismadb";
import { MemberRole } from "@/lib/prisma-enums";


export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
	if (req.method !== "DELETE" && req.method !== "PATCH" && req.method !== "PUT") {
		return res.status(405).json({ message: "Method not allowed" });
	}
	try {
		const profile = await getCurrentProfilePage(req);
		const { content } = req.body;
		const { channelId, serverId,messageId } = req.query;
		if (!profile) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		if (!channelId) {
			return res.status(400).json({ message: "ServerId and channelId are required" });
		}


		const server = await prisma.server.findFirst({
			where: {
				id: serverId as string,
				members: {
					some: {
						profileId: profile.id,
					},
				},
			},
			include: {
				members: true,
			},
		});
		if (!server) {
			return res.status(404).json({ message: "Server not found" });
		}
		const channel = await prisma.channel.findFirst({
			where: {
				id: channelId as string,
				serverId: serverId as string,
			},
		});

		if (!channel) {
			return res.status(404).json({ message: "Channel not found" });
		}

		const member = server.members.find((member) => member.profileId === profile.id);
		if (!member) {
			return res.status(404).json({ message: "Member not found" });
		}
		if (member.banned) {
			return res.status(403).json({ message: "You are banned from this server" });
		}

		let message = await prisma.message.findFirst({
            where:{
                id: messageId as string ,
                channelId: channelId as string
            },
			include: {
				member: {
					include: {
						profile: true,
					},
				},
			},
		});

        if (!message || message.deleted) {
			return res.status(404).json({ message: "Message not found" });
		}

        const isMessageOwner = message.memberId === member.id
        const isAdmin = member.role === MemberRole.ADMIN
        const isModerator = member.role === MemberRole.MODERATOR
        const canModify = isMessageOwner || isAdmin || isModerator

        if (!canModify) {
            return res.status(401).json({error:"Unauthorized"})

        }

        if(req.method === "DELETE"){
            message = await prisma.message.update({
                where:{
                    id: messageId as string ,
                },
                data: {
                    fileUrl:null,
                    content : "This message has been deleted",
                    deleted:true,
                },
                include:{
                    member:{
                        include:{
                            profile:true,
                        }
                    },
                    reactions: { include: { member: { include: { profile: true } } } },
                    replyTo: { include: { member: { include: { profile: true } } } },
                }
            })
        }
        if(req.method === "PUT"){
            const { emoji } = req.body;
            if (!emoji) {
                return res.status(400).json({ message: "Emoji is required" });
            }
            const existingReaction = await prisma.reaction.findFirst({
                where: { messageId: message.id, memberId: member.id, emoji },
            });
            if (existingReaction) {
                await prisma.reaction.delete({ where: { id: existingReaction.id } });
            } else {
                await prisma.reaction.create({
                    data: { messageId: message.id, memberId: member.id, emoji },
                });
            }
            message = await prisma.message.findFirst({
                where: { id: message.id },
                include: {
                    member: { include: { profile: true } },
                    reactions: { include: { member: { include: { profile: true } } } },
                    replyTo: { include: { member: { include: { profile: true } } } },
                },
            });
        }
        if(req.method === "PATCH"){
            // Feature: pin/unpin. Owner, admin, or moderator (canModify checked above).
            if (req.body.pinned !== undefined) {
                message = await prisma.message.update({
                    where:{
                        id: messageId as string ,
                    },
                    data: {
                        pinned: Boolean(req.body.pinned),
                    },
                    include:{
                        member:{
                            include:{
                                profile:true,
                            }
                        },
                        reactions: { include: { member: { include: { profile: true } } } },
                        replyTo: { include: { member: { include: { profile: true } } } },
                    }
                })
            } else {
                if(!isMessageOwner) {
                    return res.status(401).json({message: "Unauthorized"});
                }
                if (!content) {
                    return res.status(400).json({ message: "Content  is required" });
                }
                message = await prisma.message.update({
                    where:{
                        id: messageId as string ,
                    },
                    data: {
                        content
                    },
                    include:{
                        member:{
                            include:{
                                profile:true,
                            }
                        },
                        reactions: { include: { member: { include: { profile: true } } } },
                        replyTo: { include: { member: { include: { profile: true } } } },
                    }
                })
            }
        }
		const updateChannelKey = `chat:${channelId}:messages:update`;
		res?.socket?.server?.io?.emit(updateChannelKey, message);

		return res.status(200).json(message);
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal server error" });
	}
}
