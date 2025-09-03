import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export async function GET(...args: any[]) {
    return handler(...args);
}

export async function POST(...args: any[]) {
    return handler(...args);
}
