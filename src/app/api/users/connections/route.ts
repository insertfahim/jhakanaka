import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    { senderId: session.user.id },
                    { receiverId: session.user.id },
                ],
                status: "accepted",
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        isOnline: true,
                        lastSeen: true,
                    },
                },
                receiver: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                        isOnline: true,
                        lastSeen: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Format connections for the frontend
        const formattedConnections = connections.map((connection: any) => {
            const otherUser =
                connection.senderId === session.user.id
                    ? connection.receiver
                    : connection.sender;

            return {
                id: connection.id,
                user: otherUser,
                connectedAt: connection.createdAt,
            };
        });

        return NextResponse.json(formattedConnections);
    } catch (error) {
        console.error("Error fetching connections:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { targetUserId } = await request.json();

        if (!targetUserId) {
            return NextResponse.json(
                { error: "Target user ID is required" },
                { status: 400 }
            );
        }

        // Check if users exist
        const [currentUser, targetUser] = await Promise.all([
            prisma.user.findUnique({
                where: { id: session.user.id },
            }),
            prisma.user.findUnique({
                where: { id: targetUserId },
            }),
        ]);

        if (!currentUser || !targetUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Check if connection already exists
        const existingConnection = await prisma.connection.findFirst({
            where: {
                OR: [
                    {
                        senderId: session.user.id,
                        receiverId: targetUserId,
                    },
                    {
                        senderId: targetUserId,
                        receiverId: session.user.id,
                    },
                ],
            },
        });

        if (existingConnection) {
            if (existingConnection.status === "accepted") {
                return NextResponse.json(
                    { error: "Users are already connected" },
                    { status: 400 }
                );
            } else if (existingConnection.status === "pending") {
                return NextResponse.json(
                    { error: "Connection request already exists" },
                    { status: 400 }
                );
            }
        }

        // Create connection request
        const connection = await prisma.connection.create({
            data: {
                senderId: session.user.id,
                receiverId: targetUserId,
                status: "pending",
            },
        });

        return NextResponse.json({
            message: "Connection request sent successfully",
            connection,
        });
    } catch (error) {
        console.error("Error sending connection request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { connectionId, action } = await request.json();

        if (!connectionId || !action) {
            return NextResponse.json(
                { error: "Connection ID and action are required" },
                { status: 400 }
            );
        }

        if (!["accept", "reject"].includes(action)) {
            return NextResponse.json(
                { error: "Invalid action. Must be 'accept' or 'reject'" },
                { status: 400 }
            );
        }

        // Find the connection
        const connection = await prisma.connection.findUnique({
            where: { id: connectionId },
        });

        if (!connection) {
            return NextResponse.json(
                { error: "Connection not found" },
                { status: 404 }
            );
        }

        // Check if current user is the receiver
        if (connection.receiverId !== session.user.id) {
            return NextResponse.json(
                { error: "Unauthorized to perform this action" },
                { status: 403 }
            );
        }

        // Update connection status
        const updatedConnection = await prisma.connection.update({
            where: { id: connectionId },
            data: {
                status: action === "accept" ? "accepted" : "rejected",
            },
        });

        return NextResponse.json({
            message: `Connection request ${action}ed successfully`,
            connection: updatedConnection,
        });
    } catch (error) {
        console.error("Error updating connection:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
