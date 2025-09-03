import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        // Check if group exists and get member count
        const group = await prisma.studyGroup.findUnique({
            where: { id: groupId },
            include: {
                _count: {
                    select: {
                        members: true,
                    },
                },
            },
        });

        if (!group) {
            return NextResponse.json(
                { error: "Group not found" },
                { status: 404 }
            );
        }

        // Check if user is already a member
        const existingMember = await prisma.studyGroupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: session.user.id,
                    groupId,
                },
            },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "Already a member of this group" },
                { status: 400 }
            );
        }

        // Check if group is at capacity
        if (group._count.members >= group.maxMembers) {
            return NextResponse.json(
                { error: "Group is at maximum capacity" },
                { status: 400 }
            );
        }

        // Join the group
        const member = await prisma.studyGroupMember.create({
            data: {
                userId: session.user.id,
                groupId,
                role: "MEMBER",
            },
        });

        return NextResponse.json(member, { status: 201 });
    } catch (error) {
        console.error("Error joining group:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        // Check if user is a member
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
                { status: 400 }
            );
        }

        // Don't allow owners to leave their own group
        if (member.role === "OWNER") {
            return NextResponse.json(
                { error: "Group owners cannot leave their own group" },
                { status: 400 }
            );
        }

        // Leave the group
        await prisma.studyGroupMember.delete({
            where: {
                userId_groupId: {
                    userId: session.user.id,
                    groupId,
                },
            },
        });

        return NextResponse.json({ message: "Successfully left the group" });
    } catch (error) {
        console.error("Error leaving group:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
