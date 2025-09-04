import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { MessageType } from "@prisma/client";

const UPLOAD_DIR = join(process.cwd(), "uploads");

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

        const formData = await request.formData();
        const file = formData.get("file") as File;
        const content = formData.get("content") as string;
        const isUrgent = formData.get("isUrgent") === "true";

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "File size too large. Maximum size is 10MB" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/gif",
            "image/webp",
            "application/pdf",
            "text/plain",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/zip",
            "application/x-rar-compressed",
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "File type not allowed" },
                { status: 400 }
            );
        }

        // Create upload directory if it doesn't exist
        try {
            await mkdir(UPLOAD_DIR, { recursive: true });
        } catch {
            // Directory might already exist, ignore error
        }

        // Generate unique filename
        const fileExtension = file.name.split(".").pop();
        const fileName = `${randomUUID()}.${fileExtension}`;
        const filePath = join(UPLOAD_DIR, fileName);

        // Convert file to buffer and save
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Determine message type based on file type
        let messageType = "FILE";
        if (file.type.startsWith("image/")) {
            messageType = "IMAGE";
        }

        // Create the message with file attachment
        const message = await prisma.message.create({
            data: {
                content: content || file.name,
                userId: session.user.id,
                groupId,
                type: messageType as MessageType,
                fileUrl: `/api/files/${fileName}`,
                fileName: file.name,
                fileSize: file.size,
                isUrgent,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error("Error uploading file to message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
