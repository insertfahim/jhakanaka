import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; pollId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const resolvedParams = await params;
        const groupId = resolvedParams.id;
        const pollId = resolvedParams.pollId;

        // Check if user is a member of the group
        const member = await prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: session.user.id,
                    groupId,
                },
            },
        });

        if (!member) {
            return NextResponse.json(
                { error: "Not a member of this group" },
                { status: 403 }
            );
        }

        // Check if poll exists and belongs to the group
        const poll = await prisma.poll.findFirst({
            where: {
                id: pollId,
                groupId,
            },
        });

        if (!poll) {
            return NextResponse.json(
                { error: "Poll not found" },
                { status: 404 }
            );
        }

        // Only poll creator or group admin/owner can close poll
        if (poll.userId !== session.user.id && member.role === "MEMBER") {
            return NextResponse.json(
                { error: "Only poll creator or group admin can modify poll" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { isClosed } = body;

        if (typeof isClosed !== "boolean") {
            return NextResponse.json(
                { error: "isClosed must be a boolean" },
                { status: 400 }
            );
        }

        const updatedPoll = await prisma.poll.update({
            where: {
                id: pollId,
            },
            data: {
                isClosed,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                options: {
                    include: {
                        votes: true,
                        _count: {
                            select: {
                                votes: true,
                            },
                        },
                    },
                },
                votes: {
                    where: {
                        userId: session.user.id,
                    },
                    select: {
                        optionId: true,
                    },
                },
                _count: {
                    select: {
                        votes: true,
                    },
                },
            },
        });

        return NextResponse.json(updatedPoll);
    } catch (error) {
        console.error("Error updating poll:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
