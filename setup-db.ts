import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️ Deleting existing data...");
  await prisma.pollVote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.eventRSVP.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.forumReply.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.message.deleteMany();
  await prisma.studyGroupMember.deleteMany();
  await prisma.studyGroup.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userTag.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Existing data deleted.");

  console.log("🌟 Setting up BRAC University Study Groups Database...");

    // Create diverse BRAC University students
    const users = await Promise.all([
        // Computer Science & Engineering students
        prisma.user.create({
            data: {
                email: "fahim.ahmed@bracu.ac.bd",
                name: "Fahim Ahmed",
                studentId: "20201234",
                department: "Computer Science & Engineering",
                year: 4,
                bio: "Full-stack developer, passionate about AI and machine learning. Looking for study partners for CSE courses.",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "nusrat.jahan@g.bracu.ac.bd",
                name: "Nusrat Jahan",
                studentId: "20215678",
                department: "Computer Science & Engineering",
                year: 3,
                bio: "Data structures and algorithms enthusiast. Love helping others with programming concepts.",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "arif.hossain@bracu.ac.bd",
                name: "Arif Hossain",
                studentId: "20209876",
                department: "Computer Science & Engineering",
                year: 2,
                bio: "New to programming, struggling with CSE110. Looking for patient mentors!",
                isVerified: true,
            },
        }),

        // Business Administration students
        prisma.user.create({
            data: {
                email: "sadia.khan@bracu.ac.bd",
                name: "Sadia Khan",
                studentId: "20203456",
                department: "Business Administration",
                year: 4,
                bio: "Marketing major with interest in digital marketing. Great at explaining business concepts.",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "tanvir.ahmed@g.bracu.ac.bd",
                name: "Tanvir Ahmed",
                studentId: "20217890",
                department: "Business Administration",
                year: 3,
                bio: "Finance enthusiast, preparing for CFA. Love discussing investment strategies.",
                isVerified: true,
            },
        }),

        // Electrical & Electronic Engineering students
        prisma.user.create({
            data: {
                email: "maria.islam@bracu.ac.bd",
                name: "Maria Islam",
                studentId: "20204567",
                department: "Electrical & Electronic Engineering",
                year: 4,
                bio: "Circuit design and embedded systems expert. Always happy to help with EEE labs.",
                isVerified: true,
            },
        }),
        prisma.user.create({
            data: {
                email: "rafi.karim@g.bracu.ac.bd",
                name: "Rafi Karim",
                studentId: "20218901",
                department: "Electrical & Electronic Engineering",
                year: 2,
                bio: "Struggling with physics concepts. Looking for study groups for EEE courses.",
                isVerified: true,
            },
        }),

        // Economics students
        prisma.user.create({
            data: {
                email: "sumaiya.akter@bracu.ac.bd",
                name: "Sumaiya Akter",
                studentId: "20205678",
                department: "Economics",
                year: 3,
                bio: "Macroeconomics and development economics focus. Love discussing global economic issues.",
                isVerified: true,
            },
        }),

        // Mathematics students
        prisma.user.create({
            data: {
                email: "imran.hossain@g.bracu.ac.bd",
                name: "Imran Hossain",
                studentId: "20206789",
                department: "Mathematics",
                year: 4,
                bio: "Pure mathematics major, excellent at calculus and linear algebra. Math tutor available.",
                isVerified: true,
            },
        }),
    ]);

    console.log(`✅ Created ${users.length} BRAC University students`);

    // Create study groups for popular BRAC courses
    const studyGroups = await Promise.all([
        // CSE Courses
        prisma.studyGroup.create({
            data: {
                name: "CSE110 Programming Fundamentals",
                description:
                    "Master the basics of programming with C. Weekly problem-solving sessions and assignment help.",
                courseCode: "CSE110",
                courseName: "Programming Fundamentals",
                maxMembers: 25,
                allowAnonymous: true,
                ownerId: users[0].id, // Fahim
                members: {
                    create: [
                        { userId: users[0].id, role: "OWNER" },
                        { userId: users[1].id, role: "ADMIN" }, // Nusrat
                        { userId: users[2].id, role: "MEMBER" }, // Arif
                    ],
                },
            },
        }),

        prisma.studyGroup.create({
            data: {
                name: "CSE220 Data Structures & Algorithms",
                description:
                    "Deep dive into DSA concepts. Practice problems, mock interviews, and algorithm analysis.",
                courseCode: "CSE220",
                courseName: "Data Structures & Algorithms",
                maxMembers: 20,
                allowAnonymous: false,
                ownerId: users[1].id, // Nusrat
                members: {
                    create: [
                        { userId: users[1].id, role: "OWNER" },
                        { userId: users[0].id, role: "ADMIN" }, // Fahim
                    ],
                },
            },
        }),

        prisma.studyGroup.create({
            data: {
                name: "CSE330 Database Systems",
                description:
                    "SQL, NoSQL, and database design. Real-world projects and ER diagram practice.",
                courseCode: "CSE330",
                courseName: "Database Systems",
                maxMembers: 15,
                allowAnonymous: true,
                ownerId: users[0].id, // Fahim
                members: {
                    create: [
                        { userId: users[0].id, role: "OWNER" },
                        { userId: users[1].id, role: "MEMBER" }, // Nusrat
                    ],
                },
            },
        }),

        // Business Courses
        prisma.studyGroup.create({
            data: {
                name: "BUS101 Introduction to Business",
                description:
                    "Business fundamentals, entrepreneurship, and case study discussions.",
                courseCode: "BUS101",
                courseName: "Introduction to Business",
                maxMembers: 30,
                allowAnonymous: true,
                ownerId: users[3].id, // Sadia
                members: {
                    create: [
                        { userId: users[3].id, role: "OWNER" },
                        { userId: users[4].id, role: "ADMIN" }, // Tanvir
                    ],
                },
            },
        }),

        prisma.studyGroup.create({
            data: {
                name: "MKT301 Marketing Management",
                description:
                    "Marketing strategies, consumer behavior, and digital marketing trends.",
                courseCode: "MKT301",
                courseName: "Marketing Management",
                maxMembers: 20,
                allowAnonymous: false,
                ownerId: users[3].id, // Sadia
                members: {
                    create: [
                        { userId: users[3].id, role: "OWNER" },
                        { userId: users[4].id, role: "MEMBER" }, // Tanvir
                    ],
                },
            },
        }),

        // EEE Courses
        prisma.studyGroup.create({
            data: {
                name: "EEE101 Electrical Circuits",
                description:
                    "Circuit analysis, Ohm's law, Kirchhoff's laws, and practical circuit design.",
                courseCode: "EEE101",
                courseName: "Electrical Circuits",
                maxMembers: 18,
                allowAnonymous: true,
                ownerId: users[5].id, // Maria
                members: {
                    create: [
                        { userId: users[5].id, role: "OWNER" },
                        { userId: users[6].id, role: "MEMBER" }, // Rafi
                    ],
                },
            },
        }),

        // Math Courses
        prisma.studyGroup.create({
            data: {
                name: "MAT120 Calculus I",
                description:
                    "Limits, derivatives, integrals, and applications. Step-by-step problem solving.",
                courseCode: "MAT120",
                courseName: "Calculus I",
                maxMembers: 22,
                allowAnonymous: true,
                ownerId: users[8].id, // Imran
                members: {
                    create: [
                        { userId: users[8].id, role: "OWNER" },
                        { userId: users[0].id, role: "MEMBER" }, // Fahim
                        { userId: users[5].id, role: "MEMBER" }, // Maria
                    ],
                },
            },
        }),

        // Economics Courses
        prisma.studyGroup.create({
            data: {
                name: "ECO201 Microeconomics",
                description:
                    "Supply and demand, market structures, and economic decision-making.",
                courseCode: "ECO201",
                courseName: "Microeconomics",
                maxMembers: 25,
                allowAnonymous: false,
                ownerId: users[7].id, // Sumaiya
                members: {
                    create: [
                        { userId: users[7].id, role: "OWNER" },
                        { userId: users[4].id, role: "MEMBER" }, // Tanvir
                    ],
                },
            },
        }),
    ]);

    console.log(`✅ Created ${studyGroups.length} BRAC course study groups`);

    // Create realistic forum posts for each study group
    const forumPosts = await Promise.all([
        // CSE110 Posts
        prisma.forumPost.create({
            data: {
                title: "CSE110 Assignment 3 - Loop Problems",
                content:
                    "I'm having trouble with the nested loop problem in Assignment 3. Can someone explain how to approach the pattern printing question? The one that asks for a diamond pattern using asterisks.",
                tags: ["assignment", "loops", "help"],
                isAnonymous: false,
                userId: users[2].id, // Arif
                groupId: studyGroups[0].id,
            },
        }),

        prisma.forumPost.create({
            data: {
                title: "CSE110 Midterm Preparation Tips",
                content:
                    "What topics should I focus on for the upcoming midterm? I've been struggling with functions and arrays. Any study resources or practice problems would be greatly appreciated!",
                tags: ["midterm", "study-tips", "functions", "arrays"],
                isAnonymous: false,
                userId: users[2].id, // Arif
                groupId: studyGroups[0].id,
            },
        }),

        // CSE220 Posts
        prisma.forumPost.create({
            data: {
                title: "Time Complexity Analysis Help",
                content:
                    "Can someone help me understand Big O notation better? I'm confused about when to use O(n), O(n²), O(log n). Are there any good resources or examples?",
                tags: ["algorithms", "complexity", "big-o"],
                isAnonymous: false,
                userId: users[0].id, // Fahim
                groupId: studyGroups[1].id,
            },
        }),

        // CSE330 Posts
        prisma.forumPost.create({
            data: {
                title: "SQL JOIN Query Confusion",
                content:
                    "I'm stuck on the JOIN operations in our lab. Can someone explain the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN with examples?",
                tags: ["sql", "joins", "database"],
                isAnonymous: true,
                userId: users[1].id, // Nusrat
                groupId: studyGroups[2].id,
            },
        }),

        // BUS101 Posts
        prisma.forumPost.create({
            data: {
                title: "Case Study: BRAC's Business Model",
                content:
                    "For our group project, we're analyzing BRAC's business model. Does anyone have insights or resources about how BRAC operates as a social enterprise?",
                tags: ["case-study", "brac", "business-model"],
                isAnonymous: false,
                userId: users[3].id, // Sadia
                groupId: studyGroups[3].id,
            },
        }),

        // EEE101 Posts
        prisma.forumPost.create({
            data: {
                title: "Circuit Lab Report Help",
                content:
                    "I need help with the circuit analysis lab report. How do I calculate the equivalent resistance for this complex circuit? I have resistors in series and parallel.",
                tags: ["circuits", "lab-report", "resistance"],
                isAnonymous: false,
                userId: users[6].id, // Rafi
                groupId: studyGroups[5].id,
            },
        }),

        // MAT120 Posts
        prisma.forumPost.create({
            data: {
                title: "Integration by Parts Examples",
                content:
                    "Can someone walk me through integration by parts? I understand the formula but I'm having trouble choosing u and dv. Any practice problems?",
                tags: ["calculus", "integration", "integration-by-parts"],
                isAnonymous: false,
                userId: users[0].id, // Fahim
                groupId: studyGroups[6].id,
            },
        }),

        // ECO201 Posts
        prisma.forumPost.create({
            data: {
                title: "Supply and Demand Graph Analysis",
                content:
                    "How do I analyze shifts in supply and demand curves? What factors cause these shifts and how do they affect equilibrium price and quantity?",
                tags: ["microeconomics", "supply-demand", "graphs"],
                isAnonymous: false,
                userId: users[4].id, // Tanvir
                groupId: studyGroups[7].id,
            },
        }),
    ]);

    console.log(`✅ Created ${forumPosts.length} forum posts`);

    // Create replies to forum posts
    const forumReplies = await Promise.all([
        prisma.forumReply.create({
            data: {
                content:
                    "For the diamond pattern, you need to use nested loops. The outer loop controls the rows, and the inner loops handle the spaces and asterisks. I can share my solution if you want to compare.",
                isAnonymous: false,
                userId: users[1].id, // Nusrat
                postId: forumPosts[0].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "Focus on: 1) Basic syntax and data types, 2) Control structures (if-else, loops), 3) Functions, 4) Arrays and strings. Practice HackerRank problems for CSE110.",
                isAnonymous: false,
                userId: users[0].id, // Fahim
                postId: forumPosts[1].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "Big O notation describes algorithm performance. O(n) means time grows linearly with input size. O(n²) grows quadratically (nested loops). O(log n) is logarithmic (binary search).",
                isAnonymous: false,
                userId: users[1].id, // Nusrat
                postId: forumPosts[2].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from left table + matching from right. RIGHT JOIN is the opposite. Use Venn diagrams to visualize!",
                isAnonymous: false,
                userId: users[0].id, // Fahim
                postId: forumPosts[3].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "BRAC operates as a social enterprise with multiple business units. They cross-subsidize - profits from commercial ventures fund their development work. Very interesting model!",
                isAnonymous: false,
                userId: users[4].id, // Tanvir
                postId: forumPosts[4].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "For series resistors: R_total = R1 + R2 + R3. For parallel: 1/R_total = 1/R1 + 1/R2 + 1/R3. Can you share the specific circuit diagram?",
                isAnonymous: false,
                userId: users[5].id, // Maria
                postId: forumPosts[5].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "Choose u as the function that's easier to differentiate, dv as the one easier to integrate. For example, for ∫x*e^x dx: let u=x, dv=e^x dx. Then du=dx, v=e^x.",
                isAnonymous: false,
                userId: users[8].id, // Imran
                postId: forumPosts[6].id,
            },
        }),

        prisma.forumReply.create({
            data: {
                content:
                    "Supply shifts: technology changes, input prices, number of sellers. Demand shifts: income, preferences, prices of related goods, number of buyers. Draw the graphs!",
                isAnonymous: false,
                userId: users[7].id, // Sumaiya
                postId: forumPosts[7].id,
            },
        }),
    ]);

    console.log(`✅ Created ${forumReplies.length} forum replies`);

    // Create sample messages for chat groups
    const messages = await Promise.all([
        // CSE110 Group Messages
        prisma.message.create({
            data: {
                content:
                    "Hey everyone! Welcome to CSE110 study group. Let's make this semester productive! 📚",
                userId: users[0].id, // Fahim
                groupId: studyGroups[0].id,
                type: "TEXT",
            },
        }),

        prisma.message.create({
            data: {
                content:
                    "Hi! I'm new to programming and really struggling with loops. Can we have a session on that?",
                userId: users[2].id, // Arif
                groupId: studyGroups[0].id,
                type: "TEXT",
            },
        }),

        prisma.message.create({
            data: {
                content:
                    "Absolutely! Let's schedule a loop tutorial session this weekend. What time works for everyone?",
                userId: users[1].id, // Nusrat
                groupId: studyGroups[0].id,
                type: "TEXT",
            },
        }),

        // CSE220 Group Messages
        prisma.message.create({
            data: {
                content:
                    "Just solved a tricky LeetCode problem using dynamic programming! The key insight was to use memoization to avoid recomputation. 🧠",
                userId: users[1].id, // Nusrat
                groupId: studyGroups[1].id,
                type: "TEXT",
            },
        }),

        prisma.message.create({
            data: {
                content:
                    "That's awesome! Can you share the problem number? I want to try it too.",
                userId: users[0].id, // Fahim
                groupId: studyGroups[1].id,
                type: "TEXT",
            },
        }),

        // MAT120 Group Messages
        prisma.message.create({
            data: {
                content:
                    "Integration by parts is killing me. Does anyone have good practice problems?",
                userId: users[0].id, // Fahim
                groupId: studyGroups[6].id,
                type: "TEXT",
            },
        }),

        prisma.message.create({
            data: {
                content:
                    "I have a collection of integration problems! Let's meet in the math lab tomorrow.",
                userId: users[8].id, // Imran
                groupId: studyGroups[6].id,
                type: "TEXT",
            },
        }),
    ]);

    console.log(`✅ Created ${messages.length} sample messages`);

    // Create calendar events for BRAC University activities
    const calendarEvents = await Promise.all([
        prisma.calendarEvent.create({
            data: {
                title: "CSE110 Assignment 3 Help Session",
                description:
                    "Group study session to work through Assignment 3 problems together",
                startTime: new Date("2025-09-10T14:00:00Z"),
                endTime: new Date("2025-09-10T16:00:00Z"),
                location: "BRACU Library - Study Room 3",
                userId: users[0].id, // Fahim
                groupId: studyGroups[0].id,
            },
        }),

        prisma.calendarEvent.create({
            data: {
                title: "CSE220 Algorithm Practice",
                description:
                    "Weekly algorithm practice session with LeetCode problems",
                startTime: new Date("2025-09-12T15:00:00Z"),
                endTime: new Date("2025-09-12T17:00:00Z"),
                location: "CSE Building - Lab 201",
                userId: users[1].id, // Nusrat
                groupId: studyGroups[1].id,
            },
        }),

        prisma.calendarEvent.create({
            data: {
                title: "MAT120 Calculus Workshop",
                description:
                    "Integration techniques and practice problems workshop",
                startTime: new Date("2025-09-14T13:00:00Z"),
                endTime: new Date("2025-09-14T15:00:00Z"),
                location: "Mathematics Building - Room 101",
                userId: users[8].id, // Imran
                groupId: studyGroups[6].id,
            },
        }),

        prisma.calendarEvent.create({
            data: {
                title: "EEE101 Circuit Lab",
                description: "Hands-on circuit building and analysis session",
                startTime: new Date("2025-09-16T10:00:00Z"),
                endTime: new Date("2025-09-16T12:00:00Z"),
                location: "EEE Lab - Circuit Lab 1",
                userId: users[5].id, // Maria
                groupId: studyGroups[5].id,
            },
        }),

        prisma.calendarEvent.create({
            data: {
                title: "BUS101 Case Study Discussion",
                description:
                    "Analyzing real-world business cases and strategies",
                startTime: new Date("2025-09-18T16:00:00Z"),
                endTime: new Date("2025-09-18T18:00:00Z"),
                location: "Business Building - Conference Room A",
                userId: users[3].id, // Sadia
                groupId: studyGroups[3].id,
            },
        }),

        prisma.calendarEvent.create({
            data: {
                title: "ECO201 Study Session",
                description:
                    "Microeconomics concepts review and problem solving",
                startTime: new Date("2025-09-20T14:00:00Z"),
                endTime: new Date("2025-09-20T16:00:00Z"),
                location: "BRACU Library - Group Study Area",
                userId: users[7].id, // Sumaiya
                groupId: studyGroups[7].id,
            },
        }),
    ]);

    console.log(`✅ Created ${calendarEvents.length} calendar events`);

    // Create sample polls for student engagement
    const polls = await Promise.all([
        prisma.poll.create({
            data: {
                title: "What's your preferred study time?",
                description:
                    "Help us schedule study sessions at the best time for everyone",
                type: "SINGLE_CHOICE",
                isAnonymous: true,
                userId: users[0].id, // Fahim
                groupId: studyGroups[0].id,
            },
        }),

        prisma.poll.create({
            data: {
                title: "Which programming language should we focus on for projects?",
                description:
                    "Let's decide on a primary language for our group projects",
                type: "SINGLE_CHOICE",
                isAnonymous: false,
                userId: users[1].id, // Nusrat
                groupId: studyGroups[1].id,
            },
        }),

        prisma.poll.create({
            data: {
                title: "How confident are you with calculus concepts?",
                description:
                    "Rate your comfort level with calculus to help us plan sessions",
                type: "SINGLE_CHOICE",
                isAnonymous: true,
                userId: users[8].id, // Imran
                groupId: studyGroups[6].id,
            },
        }),

        prisma.poll.create({
            data: {
                title: "Preferred meeting location for study sessions?",
                description:
                    "Where would you like to have our study group meetings?",
                type: "SINGLE_CHOICE",
                isAnonymous: false,
                userId: users[3].id, // Sadia
                groupId: studyGroups[3].id,
            },
        }),
    ]);

    console.log(`✅ Created ${polls.length} polls`);

    // Create poll options for each poll
    const pollOptions = await Promise.all([
        // Study time poll options
        ...[
            "Morning (8-12 PM)",
            "Afternoon (12-5 PM)",
            "Evening (5-9 PM)",
            "Night (9 PM-12 AM)",
        ].map((option, index) =>
            prisma.pollOption.create({
                data: {
                    text: option,
                    pollId: polls[0].id,
                },
            })
        ),

        // Programming language poll options
        ...["C", "C++", "Java", "Python"].map((option, index) =>
            prisma.pollOption.create({
                data: {
                    text: option,
                    pollId: polls[1].id,
                },
            })
        ),

        // Calculus confidence poll options
        ...[
            "Very confident",
            "Somewhat confident",
            "Need help",
            "Completely lost",
        ].map((option, index) =>
            prisma.pollOption.create({
                data: {
                    text: option,
                    pollId: polls[2].id,
                },
            })
        ),

        // Meeting location poll options
        ...[
            "BRACU Library",
            "Department Buildings",
            "Online (Zoom)",
            "Cafeteria",
        ].map((option, index) =>
            prisma.pollOption.create({
                data: {
                    text: option,
                    pollId: polls[3].id,
                },
            })
        ),
    ]);

    console.log(`✅ Created ${pollOptions.length} poll options`);

    // Add some poll votes
    const pollVotes = await Promise.all([
        // CSE110 Study Time Poll - Fahim votes for Evening
        prisma.pollVote.create({
            data: {
                userId: users[0].id, // Fahim
                pollId: polls[0].id,
                optionId: pollOptions[2].id, // Evening
            },
        }),

        // CSE110 Study Time Poll - Nusrat votes for Afternoon
        prisma.pollVote.create({
            data: {
                userId: users[1].id, // Nusrat
                pollId: polls[0].id,
                optionId: pollOptions[1].id, // Afternoon
            },
        }),

        // CSE110 Study Time Poll - Arif votes for Morning
        prisma.pollVote.create({
            data: {
                userId: users[2].id, // Arif
                pollId: polls[0].id,
                optionId: pollOptions[0].id, // Morning
            },
        }),

        // Programming Language Poll - Fahim votes for Python
        prisma.pollVote.create({
            data: {
                userId: users[0].id, // Fahim
                pollId: polls[1].id,
                optionId: pollOptions[7].id, // Python (index 4+3=7)
            },
        }),

        // Programming Language Poll - Nusrat votes for Java
        prisma.pollVote.create({
            data: {
                userId: users[1].id, // Nusrat
                pollId: polls[1].id,
                optionId: pollOptions[6].id, // Java (index 4+2=6)
            },
        }),
    ]);

    console.log(`✅ Created ${pollVotes.length} poll votes`);

    console.log("\n🎉 BRAC University Study Groups Database Setup Complete!");
    console.log("📊 Summary:");
    console.log(
        `   👥 ${users.length} students from ${
            new Set(users.map((u) => u.department)).size
        } departments`
    );
    console.log(
        `   📚 ${studyGroups.length} study groups for popular BRAC courses`
    );
    console.log(
        `   💬 ${forumPosts.length} forum posts with ${forumReplies.length} replies`
    );
    console.log(`   💬 ${messages.length} chat messages`);
    console.log(`   📅 ${calendarEvents.length} calendar events`);
    console.log(`   🗳️  ${polls.length} polls with ${pollVotes.length} votes`);
    console.log(
        "\n🚀 Your BRAC University study group platform is ready to use!"
    );
}

main()
    .catch((e) => {
        console.error("❌ Database setup failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
