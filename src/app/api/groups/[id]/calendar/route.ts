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
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Build where clause
        const where: Record<string, unknown> = {
            groupId,
        };

        if (startDate && endDate) {
            where.startTime = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const events = await prisma.calendarEvent.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                rsvps: {
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
                        rsvps: true,
                    },
                },
            },
            orderBy: {
                startTime: "asc",
            },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Error fetching calendar events:", error);
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
            startTime,
            endTime,
            location,
            isVirtual,
            meetingLink,
        } = body;

        if (!title || !startTime || !endTime) {
            return NextResponse.json(
                { error: "Title, start time, and end time are required" },
                { status: 400 }
            );
        }

        // Create the event
        const event = await prisma.calendarEvent.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                location,
                isVirtual: isVirtual || false,
                meetingLink,
                userId: session.user.id,
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
                rsvps: true,
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
                title: "New Event Created",
                message: `New event: ${title}`,
                type: "EVENT_CREATED",
                relatedId: event.id,
                relatedType: "calendar_event",
            })),
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        console.error("Error creating calendar event:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
