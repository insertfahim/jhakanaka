import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            console.log("No session or user ID found", { session });
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        console.log("Session found for user:", session.user.id);

        const body = await request.json();
        console.log("Request body:", body);
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

        // Validate and parse numeric fields
        let parsedSemester = null;
        if (semester && semester.trim() !== "") {
            const semNum = parseInt(semester);
            if (isNaN(semNum)) {
                return NextResponse.json(
                    { error: "Invalid semester value" },
                    { status: 400 }
                );
            }
            parsedSemester = semNum;
        }

        let parsedCgpa = null;
        if (cgpa && cgpa.trim() !== "") {
            const cgpaNum = parseFloat(cgpa);
            if (isNaN(cgpaNum)) {
                return NextResponse.json(
                    { error: "Invalid CGPA value" },
                    { status: 400 }
                );
            }
            parsedCgpa = cgpaNum;
        }

        // Update user profile
        console.log("Updating user with data:", {
            major: major || null,
            semester: parsedSemester,
            cgpa: parsedCgpa,
            enrolledCourses: enrolledCoursesArray,
            skills: skillsArray,
            interests: interestsArray,
            showCgpa: showCgpa || false,
            isProfilePublic:
                isProfilePublic !== undefined ? isProfilePublic : true,
        });

        const updatedUser = await prisma.user.update({
            where: {
                id: session.user.id,
            },
            data: {
                major: major || null,
                semester: parsedSemester,
                cgpa: parsedCgpa,
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
            {
                error: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

export async function GET() {
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
