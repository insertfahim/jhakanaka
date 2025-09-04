import { NextAuthOptions, DefaultSession, Session } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// BRACU email domains
const BRACU_DOMAINS = ["@bracu.ac.bd", "@g.bracu.ac.bd"];

// Validate BRACU email domain
function isValidBracuEmail(email: string): boolean {
    return BRACU_DOMAINS.some((domain) => email.toLowerCase().endsWith(domain));
}

// Validate student ID format (typically 8 digits for BRACU)
function isValidStudentId(studentId: string): boolean {
    return /^\d{8}$/.test(studentId);
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    secret: process.env.NEXTAUTH_SECRET,
    debug: process.env.NODE_ENV === "development",

    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                studentId: { label: "Student ID", type: "text" },
                name: { label: "Full Name", type: "text" },
                isSignUp: { label: "Is Sign Up", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                const email = credentials.email.toLowerCase();

                // Validate BRACU email domain
                if (!isValidBracuEmail(email)) {
                    throw new Error(
                        "Only BRACU email addresses (@bracu.ac.bd or @g.bracu.ac.bd) are allowed"
                    );
                }

                const isSignUp = credentials.isSignUp === "true";

                if (isSignUp) {
                    // Sign up process
                    if (!credentials.studentId || !credentials.name) {
                        throw new Error(
                            "Student ID and name are required for registration"
                        );
                    }

                    if (!isValidStudentId(credentials.studentId)) {
                        throw new Error(
                            "Invalid student ID format. Must be 8 digits"
                        );
                    }

                    // Check if user already exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (existingUser) {
                        throw new Error("User already exists with this email");
                    }

                    // Check if student ID is already taken
                    const existingStudentId = await prisma.user.findUnique({
                        where: { studentId: credentials.studentId },
                    });

                    if (existingStudentId) {
                        throw new Error("Student ID already registered");
                    }

                    // Create new user
                    const user = await prisma.user.create({
                        data: {
                            email,
                            name: credentials.name,
                            studentId: credentials.studentId,
                            isVerified: true, // BRACU email is automatically verified
                        },
                    });

                    // Create account for NextAuth
                    await prisma.account.create({
                        data: {
                            userId: user.id,
                            type: "credentials",
                            provider: "credentials",
                            providerAccountId: user.id,
                        },
                    });

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        studentId: user.studentId,
                    };
                } else {
                    // Sign in process
                    let user = await prisma.user.findUnique({
                        where: { email },
                    });

                    if (!user) {
                        // For demo purposes, create user if not exists
                        const studentId = Math.floor(
                            10000000 + Math.random() * 90000000
                        ).toString();
                        const name = email
                            .split("@")[0]
                            .replace(/[^a-zA-Z ]/g, " ")
                            .trim();
                        user = await prisma.user.create({
                            data: {
                                email,
                                name: name || "Demo User",
                                studentId,
                                isVerified: true,
                            },
                        });

                        // Create account for NextAuth
                        await prisma.account.create({
                            data: {
                                userId: user.id,
                                type: "credentials",
                                provider: "credentials",
                                providerAccountId: user.id,
                            },
                        });
                    }

                    // For demo purposes, we'll skip password verification
                    // In production, you'd store and verify hashed passwords
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        studentId: user.studentId,
                    };
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
                async jwt({ token, user }: { token: JWT; user?: (import("next-auth").User) }) {
            if (user && "studentId" in user) {
                token.studentId = user.studentId as string;
            }
            return token;
        },
        async session({ session, token }: { session: Session; token: JWT }) {
            if (session.user) {
                session.user.id = token.sub!;
                if (token.studentId) {
                    (
                        session.user as typeof session.user & {
                            studentId: string;
                        }
                    ).studentId = token.studentId;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
};

declare module "next-auth" {
    interface User {
        studentId?: string;
    }
    interface Session {
        user: {
            id: string;
            studentId?: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        studentId?: string;
    }
}
