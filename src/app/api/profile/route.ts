import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
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
            major,
            semester,
            cgpa,
            enrolledCourses,
            skills,
            interests,
            showCgpa,
            isProfilePublic,
        } = body;

        // Process arrays
        const enrolledCoursesArray = enrolledCourses
            ? enrolledCourses
                  .split(/[,\n]/)
                  .map((course: string) => course.trim())
                  .filter((course: string) => course.length > 0)
            : [];

        const skillsArray = skills
            ? skills
                  .split(/[,\n]/)
                  .map((skill: string) => skill.trim())
                  .filter((skill: string) => skill.length > 0)
            : [];

        const interestsArray = interests
            ? interests
                  .split(/[,\n]/)
                  .map((interest: string) => interest.trim())
                  .filter((interest: string) => interest.length > 0)
            : [];

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                major: major || null,
                semester: semester ? parseInt(semester) : null,
                cgpa: cgpa ? parseFloat(cgpa) : null,
                enrolledCourses: enrolledCoursesArray,
                skills: skillsArray,
                interests: interestsArray,
                showCgpa: showCgpa || false,
                isProfilePublic:
                    isProfilePublic !== undefined ? isProfilePublic : true,
            },
        });

        return NextResponse.json({
            message: "Profile updated successfully",
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                major: updatedUser.major,
                semester: updatedUser.semester,
                cgpa: updatedUser.showCgpa ? updatedUser.cgpa : null,
                enrolledCourses: updatedUser.enrolledCourses,
                skills: updatedUser.skills,
                interests: updatedUser.interests,
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
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

        const user = await prisma.user.findUnique({
            where: {
                id: session.user.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                studentId: true,
                major: true,
                semester: true,
                cgpa: true,
                enrolledCourses: true,
                skills: true,
                interests: true,
                showCgpa: true,
                isProfilePublic: true,
                createdAt: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            ...user,
            cgpa: user.showCgpa ? user.cgpa : null,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
