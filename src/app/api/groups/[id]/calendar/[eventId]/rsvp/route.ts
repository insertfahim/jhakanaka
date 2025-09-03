import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; eventId: string }> }
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
        const eventId = resolvedParams.eventId;

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

        // Check if event exists and belongs to the group
        const event = await prisma.calendarEvent.findFirst({
            where: {
                id: eventId,
                groupId,
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { status } = body;

        if (!status || !["GOING", "MAYBE", "NOT_GOING"].includes(status)) {
            return NextResponse.json(
                { error: "Valid status is required (GOING, MAYBE, NOT_GOING)" },
                { status: 400 }
            );
        }

        // Check if RSVP already exists
        const existingRSVP = await prisma.eventRSVP.findUnique({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId,
                },
            },
        });

        if (existingRSVP) {
            // Update existing RSVP
            const rsvp = await prisma.eventRSVP.update({
                where: {
                    userId_eventId: {
                        userId: session.user.id,
                        eventId,
                    },
                },
                data: {
                    status,
                },
            });
            return NextResponse.json(rsvp);
        } else {
            // Create new RSVP
            const rsvp = await prisma.eventRSVP.create({
                data: {
                    userId: session.user.id,
                    eventId,
                    status,
                },
            });
            return NextResponse.json(rsvp, { status: 201 });
        }
    } catch (error) {
        console.error("Error managing RSVP:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; eventId: string }> }
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
        const eventId = resolvedParams.eventId;

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

        // Delete RSVP
        await prisma.eventRSVP.delete({
            where: {
                userId_eventId: {
                    userId: session.user.id,
                    eventId,
                },
            },
        });

        return NextResponse.json({ message: "RSVP removed" });
    } catch (error) {
        console.error("Error removing RSVP:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
