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

        // Count forum posts created by the user
        const forumPostCount = await prisma.forumPost.count({
            where: {
                userId: session.user.id,
            },
        });

        return NextResponse.json({ count: forumPostCount });
    } catch (error) {
        console.error("Error fetching user forum post count:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
