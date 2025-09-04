import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

const UPLOAD_DIR = join(process.cwd(), "uploads");

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ filename: string }> }
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
        const filename = resolvedParams.filename;
        const filePath = join(UPLOAD_DIR, filename);

        // Check if file exists
        try {
            await stat(filePath);
        } catch {
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Check if user has access to this file
        // Check if this file is the user's avatar
        const userWithAvatar = await prisma.user.findFirst({
            where: {
                id: session.user.id,
                avatar: `/api/files/${filename}`,
            },
        });

        if (userWithAvatar) {
            // User has access to their own avatar
        } else {
            // Check if user has access through messages
            const messageWithFile = await prisma.message.findFirst({
                where: {
                    fileUrl: `/api/files/${filename}`,
                },
                include: {
                    group: {
                        include: {
                            members: {
                                where: {
                                    userId: session.user.id,
                                },
                            },
                        },
                    },
                },
            });

            if (
                !messageWithFile ||
                messageWithFile.group.members.length === 0
            ) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 }
                );
            }
        }

        // Read and serve the file
        const fileBuffer = await readFile(filePath);

        // Determine content type based on file extension
        const extension = filename.split(".").pop()?.toLowerCase();
        let contentType = "application/octet-stream";

        const mimeTypes: Record<string, string> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            pdf: "application/pdf",
            txt: "text/plain",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ppt: "application/vnd.ms-powerpoint",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            zip: "application/zip",
            rar: "application/x-rar-compressed",
        };

        if (extension && mimeTypes[extension]) {
            contentType = mimeTypes[extension];
        }

        return new NextResponse(fileBuffer as unknown as BodyInit, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Error serving file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
