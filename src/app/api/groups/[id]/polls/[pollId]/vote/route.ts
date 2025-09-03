import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

        // Check if poll has expired
        if (poll.expiresAt && new Date() > poll.expiresAt) {
            return NextResponse.json(
                { error: "Poll has expired" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { optionIds } = body;

        if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
            return NextResponse.json(
                { error: "At least one option must be selected" },
                { status: 400 }
            );
        }

        // Validate options exist and belong to the poll
        const options = await prisma.pollOption.findMany({
            where: {
                id: { in: optionIds },
                pollId,
            },
        });

        if (options.length !== optionIds.length) {
            return NextResponse.json(
                { error: "Invalid option(s) selected" },
                { status: 400 }
            );
        }

        // Check if user has already voted (for single choice polls)
        if (poll.type === "SINGLE_CHOICE") {
            const existingVote = await prisma.pollVote.findFirst({
                where: {
                    userId: session.user.id,
                    pollId,
                },
            });

            if (existingVote) {
                return NextResponse.json(
                    { error: "You have already voted on this poll" },
                    { status: 400 }
                );
            }
        }

        // Create votes
        const votes = await prisma.pollVote.createMany({
            data: optionIds.map((optionId) => ({
                userId: session.user.id,
                pollId,
                optionId,
            })),
        });

        return NextResponse.json(
            { message: "Vote recorded successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error voting on poll:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
