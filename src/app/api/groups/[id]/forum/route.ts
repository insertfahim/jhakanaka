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

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search");
        const tag = searchParams.get("tag");
        const isResolved = searchParams.get("resolved");

        // Build where clause
        const where: Record<string, unknown> = {
            groupId,
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }

        if (tag) {
            where.tags = { has: tag };
        }

        if (isResolved !== null) {
            where.isResolved = isResolved === "true";
        }

        const posts = await prisma.forumPost.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                replies: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                _count: {
                    select: {
                        replies: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(posts);
    } catch (error) {
        console.error("Error fetching forum posts:", error);
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
        const { title, content, tags, isAnonymous, isUrgent } = body;

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        // Create the forum post
        const post = await prisma.forumPost.create({
            data: {
                title,
                content,
                tags: tags || [],
                isAnonymous: isAnonymous || false,
                userId: isAnonymous ? null : session.user.id,
                groupId,
                isUrgent: isUrgent || false,
                ...(isUrgent && {
                    urgentUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
                }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                replies: true,
            },
        });

        // If urgent, create notification for all group members
        if (isUrgent) {
            const groupMembers = await prisma.studyGroupMember.findMany({
                where: { groupId },
                include: { user: true },
            });

            await prisma.notification.createMany({
                data: groupMembers
                    .filter((m) => m.userId !== session.user.id)
                    .map((member) => ({
                        userId: member.userId,
                        title: "Urgent Question",
                        message: `New urgent question in forum: ${title}`,
                        type: "FORUM_ACTIVITY",
                        relatedId: post.id,
                        relatedType: "forum_post",
                    })),
            });
        }

        return NextResponse.json(post, { status: 201 });
    } catch (error) {
        console.error("Error creating forum post:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
