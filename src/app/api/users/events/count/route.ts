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

        // Count calendar events created by the user
        const eventCount = await prisma.calendarEvent.count({
            where: {
                userId: session.user.id,
            },
        });

        return NextResponse.json({ count: eventCount });
    } catch (error) {
        console.error("Error fetching user event count:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
