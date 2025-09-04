import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma, ConnectionStatus } from "@prisma/client";

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
        const search = searchParams.get("search");
        const department = searchParams.get("department");
        const year = searchParams.get("year");
        const group = searchParams.get("group");

        // Build where clause
        const where: {
            id?: { not: string };
            OR?: Array<{
                name?: { contains: string; mode: Prisma.QueryMode };
                email?: { contains: string; mode: Prisma.QueryMode };
                studentId?: { contains: string; mode: Prisma.QueryMode };
            }>;
            department?: string;
            year?: number;
            groups?: {
                some?: { id?: { in: string[] } };
                none?: Record<string, never>;
            };
        } = {
            id: {
                not: session.user.id, // Exclude current user
            },
        };

        // Search filter
        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                    },
                },
                {
                    studentId: {
                        contains: search,
                        mode: Prisma.QueryMode.insensitive,
                    },
                },
            ];
        }

        // Department filter
        if (department) {
            where.department = department;
        }

        // Year filter
        if (year) {
            where.year = parseInt(year);
        }

        // Group filter
        if (group) {
            if (group === "shared") {
                // Users who are in groups with the current user
                const userGroups = await prisma.studyGroupMember.findMany({
                    where: { userId: session.user.id },
                    select: { groupId: true },
                });

                const groupIds = userGroups.map(
                    (g: { groupId: string }) => g.groupId
                );

                where.groups = {
                    some: {
                        id: {
                            in: groupIds,
                        },
                    },
                };
            } else if (group === "none") {
                // Users who are not in any groups
                where.groups = {
                    none: {},
                };
            }
        }

        // Get users with their connection status
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                bio: true,
                avatar: true,
                department: true,
                year: true,
                interests: true,
                isOnline: true,
                lastSeen: true,
                _count: {
                    select: {
                        studyGroups: true,
                        sentConnections: true,
                        receivedConnections: true,
                    },
                },
                studyGroups: {
                    select: {
                        id: true,
                        group: {
                            select: {
                                name: true,
                                courseCode: true,
                            },
                        },
                    },
                    take: 5, // Limit to prevent too much data
                },
            },
            take: 50, // Limit results
            orderBy: [
                { isOnline: "desc" },
                { lastSeen: "desc" },
                { name: "asc" },
            ],
        });

        // Get connection statuses for these users
        const userIds = users.map((user: { id: string }) => user.id);
        const connections = await prisma.connection.findMany({
            where: {
                OR: [
                    {
                        senderId: session.user.id,
                        receiverId: { in: userIds },
                    },
                    {
                        senderId: { in: userIds },
                        receiverId: session.user.id,
                    },
                ],
            },
            select: {
                senderId: true,
                receiverId: true,
                status: true,
            },
        });

        // Add connection status to each user
        const usersWithConnectionStatus = users.map((user) => {
            const connection = connections.find(
                (conn: {
                    senderId: string;
                    receiverId: string;
                    status: string;
                }) =>
                    (conn.senderId === session.user.id &&
                        conn.receiverId === user.id) ||
                    (conn.senderId === user.id &&
                        conn.receiverId === session.user.id)
            );

            let connectionStatus: "none" | "pending" | "connected" | "blocked" =
                "none";

            if (connection) {
                if (connection.status === ConnectionStatus.ACCEPTED) {
                    connectionStatus = "connected";
                } else if (connection.status === ConnectionStatus.PENDING) {
                    connectionStatus = "pending"; // We sent the request
                } else if (connection.status === ConnectionStatus.BLOCKED) {
                    connectionStatus = "blocked";
                } else if (connection.status === ConnectionStatus.REJECTED) {
                    connectionStatus = "none"; // Treat rejected as no connection
                }
            }

            return {
                ...user,
                connectionStatus,
            };
        });

        return NextResponse.json(usersWithConnectionStatus);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
