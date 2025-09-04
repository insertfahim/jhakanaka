import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface UserWhereInput {
    id?: { not: string };
    OR?: Array<{
        name?: { contains: string; mode: Prisma.QueryMode };
        major?: { contains: string; mode: Prisma.QueryMode };
        skills?: { has: string };
        interests?: { has: string };
    }>;
    major?: { contains: string; mode: Prisma.QueryMode };
    semester?: number;
    cgpa?: { gte?: number; lte?: number };
    skills?: { has: string };
    interests?: { has: string };
    enrolledCourses?: { has: string };
    isProfilePublic?: boolean;
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
        const search = searchParams.get("search");
        const major = searchParams.get("major");
        const semester = searchParams.get("semester");
        const minCgpa = searchParams.get("minCgpa");
        const maxCgpa = searchParams.get("maxCgpa");
        const skills = searchParams.get("skills");
        const interests = searchParams.get("interests");
        const course = searchParams.get("course");

        // Build where clause
        const where: UserWhereInput = {
            id: { not: session.user.id }, // Exclude current user
            isProfilePublic: true, // Only show public profiles
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { major: { contains: search, mode: Prisma.QueryMode.insensitive } },
                { skills: { has: search } },
                { interests: { has: search } },
            ];
        }

        if (major) {
            where.major = { contains: major, mode: "insensitive" };
        }

        if (semester) {
            where.semester = parseInt(semester);
        }

        if (minCgpa || maxCgpa) {
            where.cgpa = {};
            if (minCgpa) {
                where.cgpa.gte = parseFloat(minCgpa);
            }
            if (maxCgpa) {
                where.cgpa.lte = parseFloat(maxCgpa);
            }
        }

        if (skills) {
            where.skills = { has: skills };
        }

        if (interests) {
            where.interests = { has: interests };
        }

        if (course) {
            where.enrolledCourses = { has: course };
        }

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                major: true,
                semester: true,
                cgpa: true,
                skills: true,
                interests: true,
                enrolledCourses: true,
                showCgpa: true,
                _count: {
                    select: {
                        studyGroups: true,
                    },
                },
            },
            take: 50, // Limit results
        });

        // Filter out CGPA if user doesn't want to show it
        const filteredUsers = users.map((user) => ({
            ...user,
            cgpa: user.showCgpa ? user.cgpa : null,
        }));

        return NextResponse.json(filteredUsers);
    } catch (error) {
        console.error("Error searching users:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
