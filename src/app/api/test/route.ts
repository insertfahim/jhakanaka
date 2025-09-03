import { NextResponse } from "next/server";

export async function GET() {
    try {
        // Simple health check
        return NextResponse.json({
            status: "ok",
            timestamp: new Date().toISOString(),
            message: "API is working",
        });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
