import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as ServerIO } from "socket.io";
import { prisma } from "@/lib/prisma";
import { MessageType } from "@prisma/client";

export type NextApiResponseServerIo = NextApiResponse & {
    socket: {
        server: NetServer & {
            io: ServerIO;
        };
    };
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
    if (!res.socket.server.io) {
        const io = new ServerIO(res.socket.server, {
            path: "/api/socket",
            addTrailingSlash: false,
        });

        // Store connected users
        const connectedUsers = new Map<string, string>(); // userId -> socketId

        io.on("connection", (socket) => {
            console.log("User connected:", socket.id);

            // Join group room
            socket.on(
                "join-group",
                async (data: { groupId: string; userId: string }) => {
                    try {
                        // Verify user is member of the group
                        const member = await prisma.studyGroupMember.findUnique(
                            {
                                where: {
                                    userId_groupId: {
                                        userId: data.userId,
                                        groupId: data.groupId,
                                    },
                                },
                            }
                        );

                        if (member) {
                            socket.join(data.groupId);
                            connectedUsers.set(data.userId, socket.id);
                            console.log(
                                `User ${data.userId} joined group ${data.groupId}`
                            );
                        } else {
                            socket.emit("error", {
                                message: "Not authorized to join this group",
                            });
                        }
                    } catch (error) {
                        console.error("Error joining group:", error);
                        socket.emit("error", {
                            message: "Failed to join group",
                        });
                    }
                }
            );

            // Handle new messages
            socket.on(
                "send-message",
                async (data: {
                    groupId: string;
                    userId: string;
                    content: string;
                    type?: string;
                    isUrgent?: boolean;
                }) => {
                    try {
                        // Create message in database
                        const message = await prisma.message.create({
                            data: {
                                content: data.content,
                                userId: data.userId,
                                groupId: data.groupId,
                                type: (data.type as MessageType) || MessageType.TEXT,
                                isUrgent: data.isUrgent || false,
                            },
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        });

                        // Broadcast to group
                        io.to(data.groupId).emit("new-message", message);

                        // Handle urgent messages
                        if (data.isUrgent) {
                            // Get all group members except sender
                            const members =
                                await prisma.studyGroupMember.findMany({
                                    where: { groupId: data.groupId },
                                    include: { user: true },
                                });

                            // Create notifications for urgent help
                            await prisma.notification.createMany({
                                data: members
                                    .filter((m) => m.userId !== data.userId)
                                    .map((member) => ({
                                        userId: member.userId,
                                        title: "Urgent Help Request",
                                        message: `${message.user.name} needs urgent help`,
                                        type: "URGENT_HELP" as const,
                                        relatedId: message.id,
                                        relatedType: "message",
                                    })),
                            });

                            // Emit urgent notification to group
                            io.to(data.groupId).emit("urgent-message", {
                                message,
                                notification: {
                                    title: "Urgent Help Request",
                                    message: `${message.user.name} needs urgent help`,
                                },
                            });
                        }
                    } catch (error) {
                        console.error("Error sending message:", error);
                        socket.emit("error", {
                            message: "Failed to send message",
                        });
                    }
                }
            );

            // Handle typing indicators
            socket.on(
                "typing-start",
                (data: {
                    groupId: string;
                    userId: string;
                    userName: string;
                }) => {
                    socket.to(data.groupId).emit("user-typing", {
                        userId: data.userId,
                        userName: data.userName,
                        isTyping: true,
                    });
                }
            );

            socket.on(
                "typing-stop",
                (data: { groupId: string; userId: string }) => {
                    socket.to(data.groupId).emit("user-typing", {
                        userId: data.userId,
                        isTyping: false,
                    });
                }
            );

            // Handle disconnection
            socket.on("disconnect", () => {
                console.log("User disconnected:", socket.id);
                // Remove from connected users
                for (const [userId, socketId] of connectedUsers.entries()) {
                    if (socketId === socket.id) {
                        connectedUsers.delete(userId);
                        break;
                    }
                }
            });
        });

        res.socket.server.io = io;
    }

    res.end();
};

export default ioHandler;
