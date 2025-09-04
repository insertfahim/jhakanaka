import { NextResponse } from "next/server";
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

        // Count messages sent by the user across all groups
        const messageCount = await prisma.message.count({
            where: {
                userId: session.user.id,
            },
        });

        return NextResponse.json({ count: messageCount });
    } catch (error) {
        console.error("Error fetching user message count:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
