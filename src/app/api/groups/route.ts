import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            name,
            description,
            courseCode,
            courseName,
            maxMembers,
            isPrivate,
            allowAnonymous,
        } = body;

        // Validate required fields
        if (!name || !courseCode || !courseName) {
            return NextResponse.json(
                { error: "Name, course code, and course name are required" },
                { status: 400 }
            );
        }

        // Create the study group
        const group = await prisma.studyGroup.create({
            data: {
                name,
                description,
                courseCode,
                courseName,
                maxMembers,
                isPrivate,
                allowAnonymous,
                ownerId: session.user.id,
                members: {
                    create: {
                        userId: session.user.id,
                        role: "OWNER",
                    },
                },
            },
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        return NextResponse.json(group, { status: 201 });
    } catch (error) {
        console.error("Error creating study group:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const courseCode = searchParams.get("courseCode");
        const search = searchParams.get("search");

        // Build where clause
        const where: Record<string, unknown> = {};

        if (courseCode) {
            where.courseCode = courseCode;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { courseName: { contains: search, mode: "insensitive" } },
                { courseCode: { contains: search, mode: "insensitive" } },
            ];
        }

        const groups = await prisma.studyGroup.findMany({
            where,
            include: {
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                members: {
                    where: {
                        userId: session.user.id,
                    },
                    select: {
                        role: true,
                    },
                },
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Add isMember flag
        const groupsWithMembership = groups.map(
            (group: (typeof groups)[0]) => ({
                ...group,
                isMember: group.members.length > 0,
                memberRole: group.members[0]?.role || null,
            })
        );

        return NextResponse.json(groupsWithMembership);
    } catch (error) {
        console.error("Error fetching study groups:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
