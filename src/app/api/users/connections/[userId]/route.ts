import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const targetUserId = params.userId;

        if (!targetUserId) {
            return NextResponse.json(
                { error: "Target user ID is required" },
                { status: 400 }
            );
        }

        // Find and delete the connection request
        const connection = await prisma.connection.findFirst({
            where: {
                OR: [
                    {
                        senderId: session.user.id,
                        receiverId: targetUserId,
                        status: "pending",
                    },
                    {
                        senderId: targetUserId,
                        receiverId: session.user.id,
                        status: "pending",
                    },
                ],
            },
        });

        if (!connection) {
            return NextResponse.json(
                { error: "Connection request not found" },
                { status: 404 }
            );
        }

        // Delete the connection
        await prisma.connection.delete({
            where: { id: connection.id },
        });

        return NextResponse.json({
            message: "Connection request canceled successfully",
        });
    } catch (error) {
        console.error("Error canceling connection request:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
