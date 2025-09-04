import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        const polls = await prisma.poll.findMany({
            where: {
                groupId,
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
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(polls);
    } catch (error) {
        console.error("Error fetching polls:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
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

        const body = await request.json();
        const {
            title,
            description,
            type,
            options,
            isAnonymous,
            allowAddOptions,
            expiresAt,
        } = body;

        if (!title || !options || options.length < 2) {
            return NextResponse.json(
                { error: "Title and at least 2 options are required" },
                { status: 400 }
            );
        }

        if (!["SINGLE_CHOICE", "MULTIPLE_CHOICE", "YES_NO"].includes(type)) {
            return NextResponse.json(
                { error: "Invalid poll type" },
                { status: 400 }
            );
        }

        // Create the poll
        const poll = await prisma.poll.create({
            data: {
                title,
                description,
                type,
                isAnonymous: isAnonymous || false,
                allowAddOptions:
                    allowAddOptions !== undefined ? allowAddOptions : true,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                userId: session.user.id,
                groupId,
                options: {
                    create: options.map((option: string) => ({
                        text: option,
                    })),
                },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                options: true,
            },
        });

        // Create notification for all group members
        const groupMembers = await prisma.studyGroupMember.findMany({
            where: { groupId },
            include: { user: true },
        });

        await prisma.notification.createMany({
            data: groupMembers.map((member) => ({
                userId: member.userId,
                title: "New Poll Created",
                message: `New poll: ${title}`,
                type: "POLL_CREATED",
                relatedId: poll.id,
                relatedType: "poll",
            })),
        });

        return NextResponse.json(poll, { status: 201 });
    } catch (error) {
        console.error("Error creating poll:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
