import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
                name?: { contains: string; mode: string };
                email?: { contains: string; mode: string };
                studentId?: { contains: string; mode: string };
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
                        mode: "insensitive",
                    },
                },
                {
                    email: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    studentId: {
                        contains: search,
                        mode: "insensitive",
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
                const userGroups = await prisma.groupMember.findMany({
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
                        groups: true,
                        connections: true,
                    },
                },
                groups: {
                    select: {
                        id: true,
                        name: true,
                        courseCode: true,
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
        const usersWithConnectionStatus = users.map((user: any) => {
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
                if (connection.status === "accepted") {
                    connectionStatus = "connected";
                } else if (connection.status === "pending") {
                    if (connection.senderId === session.user.id) {
                        connectionStatus = "pending"; // We sent the request
                    } else {
                        connectionStatus = "pending"; // They sent the request (we can accept/reject)
                    }
                } else if (connection.status === "blocked") {
                    connectionStatus = "blocked";
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
