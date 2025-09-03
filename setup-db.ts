import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Setting up BRACU Notes database...");

    // Create some sample users
    const users = await Promise.all([
        prisma.user.create({
            data: {
                email: "student1@bracu.ac.bd",
                name: "John Doe",
                studentId: "12345678",
                department: "Computer Science",
                year: 3,
                bio: "Passionate about programming and machine learning",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "student2@g.bracu.ac.bd",
                name: "Jane Smith",
                studentId: "87654321",
                department: "Business Administration",
                year: 2,
                bio: "Interested in entrepreneurship and marketing",
                isVerified: true,
            },
        }),
    ]);

    console.log(
        "Created sample users:",
        users.map((u) => u.name)
    );

    // Create a sample study group
    const group = await prisma.studyGroup.create({
        data: {
            name: "CSE110 Study Group",
            description: "Programming Fundamentals study group for beginners",
            courseCode: "CSE110",
            courseName: "Programming Fundamentals",
            maxMembers: 10,
            ownerId: users[0].id,
            members: {
                create: {
                    userId: users[0].id,
                    role: "OWNER",
                },
            },
        },
    });

    console.log("Created sample study group:", group.name);

    // Create a sample forum post
    const post = await prisma.forumPost.create({
        data: {
            title: "Help with Assignment 3",
            content: "I'm stuck on problem 2. Can someone explain the logic?",
            tags: ["assignment", "help"],
            userId: users[1].id,
            groupId: group.id,
        },
    });

    console.log("Created sample forum post:", post.title);

    // Create a sample calendar event
    const event = await prisma.calendarEvent.create({
        data: {
            title: "Midterm Study Session",
            description: "Group study session for upcoming midterm",
            startTime: new Date("2024-01-15T14:00:00Z"),
            endTime: new Date("2024-01-15T16:00:00Z"),
            location: "BRACU Library",
            userId: users[0].id,
            groupId: group.id,
        },
    });

    console.log("Created sample calendar event:", event.title);

    console.log("Database setup completed!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
