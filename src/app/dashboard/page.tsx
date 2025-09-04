"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import ChatInterface from "@/components/ChatInterface";
import StudyGroupsList from "@/components/StudyGroupsList";
import CreateGroupDialog from "@/components/CreateGroupDialog";
import Calendar from "@/components/Calendar";
import Forum from "@/components/Forum";
import PollSimple from "@/components/PollSimple";
import UserDiscovery from "@/components/UserDiscovery";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface UserGroup {
    id: string;
    name: string;
    description: string | null;
    courseCode: string;
    courseName: string;
    _count: {
        members: number;
    };
}

interface UserProfile {
    id: string;
    name: string;
    email: string;
    studentId: string;
    major: string;
    semester: number;
    cgpa: number | null;
    enrolledCourses: string[];
    skills: string[];
    interests: string[];
    showCgpa: boolean;
    isProfilePublic: boolean;
    createdAt: string;
}

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [searchQuery, setSearchQuery] = useState("");
    const [courseFilter, setCourseFilter] = useState("");
    const [groupUpdateTrigger, setGroupUpdateTrigger] = useState(0);
    const [selectedGroupForChat, setSelectedGroupForChat] = useState<{
        id: string;
        name: string;
    } | null>(null);
    const [createGroupDialogOpen, setCreateGroupDialogOpen] = useState(false);
    const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
    const [stats, setStats] = useState({
        studyGroups: 0,
        messages: 0,
        forumPosts: 0,
        events: 0,
    });
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    const fetchUserProfile = useCallback(async () => {
        if (session?.user?.id) {
            try {
                const response = await fetch("/api/profile");
                if (response.ok) {
                    const profile = await response.json();
                    setUserProfile(profile);
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            }
        }
    }, [session?.user?.id]);

    useEffect(() => {
        const fetchUserGroups = async () => {
            if (session?.user?.id) {
                try {
                    const response = await fetch("/api/groups");
                    if (response.ok) {
                        const groups = await response.json();
                        setUserGroups(groups);

                        // Calculate stats
                        const totalGroups = groups.length;
                        const totalMessages = await fetchUserMessageCount();
                        const totalForumPosts = await fetchUserForumPostCount();
                        const totalEvents = await fetchUserEventCount();

                        setStats({
                            studyGroups: totalGroups,
                            messages: totalMessages,
                            forumPosts: totalForumPosts,
                            events: totalEvents,
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user groups:", error);
                }
            }
        };

        fetchUserGroups();
        fetchUserProfile();
    }, [session?.user?.id, fetchUserProfile]);

    const fetchUserMessageCount = async (): Promise<number> => {
        try {
            const response = await fetch("/api/users/messages/count");
            if (response.ok) {
                const data = await response.json();
                return data.count;
            }
            return 0;
        } catch (error) {
            console.error("Error fetching message count:", error);
            return 0;
        }
    };

    const fetchUserForumPostCount = async (): Promise<number> => {
        try {
            const response = await fetch("/api/users/forum-posts/count");
            if (response.ok) {
                const data = await response.json();
                return data.count;
            }
            return 0;
        } catch (error) {
            console.error("Error fetching forum post count:", error);
            return 0;
        }
    };

    const fetchUserEventCount = async (): Promise<number> => {
        try {
            const response = await fetch("/api/users/events/count");
            if (response.ok) {
                const data = await response.json();
                return data.count;
            }
            return 0;
        } catch (error) {
            console.error("Error fetching event count:", error);
            return 0;
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    const navigation = [
        { name: "Overview", href: "#", current: activeTab === "overview" },
        { name: "Study Groups", href: "#", current: activeTab === "groups" },
        { name: "Calendar", href: "#", current: activeTab === "calendar" },
        { name: "Messages", href: "#", current: activeTab === "messages" },
        { name: "Q&A Forum", href: "#", current: activeTab === "forum" },
        { name: "Polls", href: "#", current: activeTab === "polls" },
        {
            name: "Discover Users",
            href: "#",
            current: activeTab === "discover-users",
        },
        { name: "Profile", href: "#", current: activeTab === "profile" },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                    <svg
                                        className="h-5 w-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                </div>
                                <span className="ml-2 text-xl font-bold text-gray-900">
                                    BRACU Notes
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                                        <span className="text-sm font-medium text-white">
                                            {session.user?.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "U"}
                                        </span>
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <div className="text-sm font-medium text-gray-900">
                                        {session.user?.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {session.user?.email}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Secondary Navigation */}
                    <div className="border-b border-gray-200 mb-8">
                        <nav className="-mb-px flex space-x-8">
                            {navigation.map((item) => (
                                <button
                                    key={item.name}
                                    onClick={() => {
                                        let tabName = item.name.toLowerCase();
                                        if (tabName === "study groups") {
                                            tabName = "groups";
                                        } else if (tabName === "q&a forum") {
                                            tabName = "forum";
                                        } else if (tabName === "discover users") {
                                            tabName = "discover-users";
                                        }
                                        setActiveTab(tabName.replace(" ", "-").replace("&", ""));
                                    }}
                                    className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                                        item.current
                                            ? "border-blue-500 text-blue-600"
                                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                                >
                                    {item.name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="bg-white shadow rounded-lg">
                        {activeTab === "overview" && (
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                    Welcome back, {session.user?.name}!
                                </h1>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                    <div className="bg-blue-50 p-6 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-8 w-8 text-blue-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">
                                                    Study Groups
                                                </p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {stats.studyGroups}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-6 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-8 w-8 text-green-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">
                                                    Messages
                                                </p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {stats.messages}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-purple-50 p-6 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-8 w-8 text-purple-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V9l4-4m-6 8v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-2.172a2 2 0 011.586-1.414l2.828-2.828A2 2 0 0114 9.172V11z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">
                                                    Forum Posts
                                                </p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {stats.forumPosts}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-orange-50 p-6 rounded-lg">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg
                                                    className="h-8 w-8 text-orange-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    />
                                                </svg>
                                            </div>
                                            <div className="ml-4">
                                                <p className="text-sm font-medium text-gray-600">
                                                    Events
                                                </p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {stats.events}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-gray-50 rounded-lg p-6">
                                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                                        Quick Actions
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <button
                                            onClick={() => {
                                                setActiveTab("groups");
                                                setCreateGroupDialogOpen(true);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Create Study Group
                                        </button>
                                        <button
                                            onClick={() =>
                                                setActiveTab("groups")
                                            }
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Join Study Group
                                        </button>
                                        <button
                                            onClick={() => {
                                                setActiveTab("messages");
                                                // Select first available group if any
                                                if (userGroups.length > 0) {
                                                    setSelectedGroupForChat({
                                                        id: userGroups[0].id,
                                                        name: userGroups[0]
                                                            .name,
                                                    });
                                                }
                                            }}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Ask Question
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "groups" && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Study Groups
                                    </h1>
                                    <CreateGroupDialog
                                        open={createGroupDialogOpen}
                                        onOpenChange={setCreateGroupDialogOpen}
                                        onGroupCreated={() => {
                                            setGroupUpdateTrigger(
                                                (prev) => prev + 1
                                            );
                                            setCreateGroupDialogOpen(false);
                                        }}
                                    >
                                        <Button>Create Study Group</Button>
                                    </CreateGroupDialog>
                                </div>

                                {/* Search and Filters */}
                                <div className="bg-white p-4 rounded-lg border mb-6">
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1">
                                            <Input
                                                placeholder="Search groups by name, course code, or course name..."
                                                value={searchQuery}
                                                onChange={(e) =>
                                                    setSearchQuery(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="sm:w-48">
                                            <Input
                                                placeholder="Filter by course code (e.g., CSE110)"
                                                value={courseFilter}
                                                onChange={(e) =>
                                                    setCourseFilter(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                        {(searchQuery || courseFilter) && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSearchQuery("");
                                                    setCourseFilter("");
                                                }}
                                            >
                                                Clear
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <StudyGroupsList
                                    searchQuery={searchQuery}
                                    courseFilter={courseFilter}
                                    onGroupUpdate={() =>
                                        setGroupUpdateTrigger(
                                            (prev) => prev + 1
                                        )
                                    }
                                    key={groupUpdateTrigger}
                                />
                            </div>
                        )}

                        {activeTab === "calendar" && (
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                    Calendar
                                </h1>

                                {!selectedGroupForChat ? (
                                    <div className="space-y-6">
                                        <div className="text-center py-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Select a Study Group for
                                                Calendar
                                            </h3>
                                            <p className="text-gray-600">
                                                Choose a group to view and
                                                manage events
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {userGroups.length === 0 ? (
                                                <div className="text-center py-8 col-span-full">
                                                    <p className="text-gray-500">
                                                        You haven&apos;t joined
                                                        any groups yet.
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Join a group to view and
                                                        create events.
                                                    </p>
                                                </div>
                                            ) : (
                                                userGroups.map((group) => (
                                                    <Card
                                                        key={group.id}
                                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                                        onClick={() =>
                                                            setSelectedGroupForChat(
                                                                {
                                                                    id: group.id,
                                                                    name: group.name,
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <CardHeader>
                                                            <CardTitle className="text-lg">
                                                                {group.name}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {
                                                                    group.courseCode
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    group.courseName
                                                                }
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                {group.description ||
                                                                    "No description"}
                                                            </p>
                                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                                <span>
                                                                    {
                                                                        group
                                                                            ._count
                                                                            .members
                                                                    }{" "}
                                                                    members
                                                                </span>
                                                                <Button size="sm">
                                                                    View
                                                                    Calendar
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setSelectedGroupForChat(
                                                        null
                                                    )
                                                }
                                            >
                                                ← Back to Groups
                                            </Button>
                                            <h2 className="text-lg font-semibold">
                                                {selectedGroupForChat.name}{" "}
                                                Calendar
                                            </h2>
                                        </div>

                                        <Calendar
                                            groupId={selectedGroupForChat.id}
                                            groupName={
                                                selectedGroupForChat.name
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "messages" && (
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                    Messages
                                </h1>

                                {!selectedGroupForChat ? (
                                    <div className="space-y-6">
                                        <div className="text-center py-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Select a Study Group to Chat
                                            </h3>
                                            <p className="text-gray-600">
                                                Choose a group from the list
                                                below to start messaging
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {userGroups.length === 0 ? (
                                                <div className="text-center py-8 col-span-full">
                                                    <p className="text-gray-500">
                                                        You haven&apos;t joined
                                                        any groups yet.
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Join a group from the
                                                        Groups tab to start
                                                        chatting.
                                                    </p>
                                                </div>
                                            ) : (
                                                userGroups.map((group) => (
                                                    <Card
                                                        key={group.id}
                                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                                        onClick={() =>
                                                            setSelectedGroupForChat(
                                                                {
                                                                    id: group.id,
                                                                    name: group.name,
                                                                }
                                                            )
                                                        }
                                                    >
                                                        <CardHeader>
                                                            <CardTitle className="text-lg">
                                                                {group.name}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {
                                                                    group.courseCode
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    group.courseName
                                                                }
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                {group.description ||
                                                                    "No description"}
                                                            </p>
                                                            <div className="flex justify-between items-center text-sm text-gray-500">
                                                                <span>
                                                                    {
                                                                        group
                                                                            ._count
                                                                            .members
                                                                    }{" "}
                                                                    members
                                                                </span>
                                                                <Button size="sm">
                                                                    Chat
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setSelectedGroupForChat(
                                                        null
                                                    )
                                                }
                                            >
                                                ← Back to Groups
                                            </Button>
                                            <h2 className="text-lg font-semibold">
                                                {selectedGroupForChat.name}
                                            </h2>
                                        </div>

                                        <ChatInterface
                                            groupId={selectedGroupForChat.id}
                                            groupName={
                                                selectedGroupForChat.name
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "forum" && (
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                    Q&A Forum
                                </h1>

                                {!selectedGroupForChat ? (
                                    <div className="space-y-6">
                                        <div className="text-center py-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Select a Study Group for Q&A
                                                Forum
                                            </h3>
                                            <p className="text-gray-600">
                                                Choose a group to ask questions
                                                and share knowledge
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {userGroups.length === 0 ? (
                                                <div className="text-center py-8 col-span-full">
                                                    <p className="text-gray-500">
                                                        You haven&apos;t joined
                                                        any groups yet.
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Join a group to ask
                                                        questions and
                                                        participate in
                                                        discussions.
                                                    </p>
                                                </div>
                                            ) : (
                                                userGroups.map((group) => (
                                                    <Card
                                                        key={group.id}
                                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                                        onClick={() =>
                                                            setSelectedGroupForChat(
                                                                group
                                                            )
                                                        }
                                                    >
                                                        <CardHeader>
                                                            <CardTitle className="text-lg">
                                                                {group.name}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {
                                                                    group.courseCode
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    group.courseName
                                                                }
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                {
                                                                    group.description
                                                                }
                                                            </p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-gray-500">
                                                                    {
                                                                        group
                                                                            ._count
                                                                            .members
                                                                    }{" "}
                                                                    members
                                                                </span>
                                                                <Button size="sm">
                                                                    Select Group
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSelectedGroupForChat(
                                                            null
                                                        )
                                                    }
                                                >
                                                    ← Back to Groups
                                                </Button>
                                                <div>
                                                    <h2 className="text-xl font-semibold text-gray-900">
                                                        {
                                                            selectedGroupForChat.name
                                                        }
                                                    </h2>
                                                    <p className="text-sm text-gray-600">
                                                        Q&A Forum
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <Forum
                                            groupId={selectedGroupForChat.id}
                                            groupName={
                                                selectedGroupForChat.name
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "polls" && (
                            <div className="p-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                                    Polls
                                </h1>

                                {!selectedGroupForChat ? (
                                    <div className="space-y-6">
                                        <div className="text-center py-8">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                Select a Study Group for Polls
                                            </h3>
                                            <p className="text-gray-600">
                                                Choose a group to create and
                                                participate in polls
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {userGroups.length === 0 ? (
                                                <div className="text-center py-8 col-span-full">
                                                    <p className="text-gray-500">
                                                        You haven&apos;t joined
                                                        any groups yet.
                                                    </p>
                                                    <p className="text-sm text-gray-400 mt-2">
                                                        Join a group to create
                                                        and participate in
                                                        polls.
                                                    </p>
                                                </div>
                                            ) : (
                                                userGroups.map((group) => (
                                                    <Card
                                                        key={group.id}
                                                        className="cursor-pointer hover:shadow-md transition-shadow"
                                                        onClick={() =>
                                                            setSelectedGroupForChat(
                                                                group
                                                            )
                                                        }
                                                    >
                                                        <CardHeader>
                                                            <CardTitle className="text-lg">
                                                                {group.name}
                                                            </CardTitle>
                                                            <CardDescription>
                                                                {
                                                                    group.courseCode
                                                                }{" "}
                                                                -{" "}
                                                                {
                                                                    group.courseName
                                                                }
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                {
                                                                    group.description
                                                                }
                                                            </p>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-gray-500">
                                                                    {
                                                                        group
                                                                            ._count
                                                                            .members
                                                                    }{" "}
                                                                    members
                                                                </span>
                                                                <Button size="sm">
                                                                    Select Group
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() =>
                                                        setSelectedGroupForChat(
                                                            null
                                                        )
                                                    }
                                                >
                                                    ← Back to Groups
                                                </Button>
                                                <div>
                                                    <h2 className="text-xl font-semibold text-gray-900">
                                                        {
                                                            selectedGroupForChat.name
                                                        }
                                                    </h2>
                                                    <p className="text-sm text-gray-600">
                                                        Polls
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <PollSimple
                                            groupId={selectedGroupForChat.id}
                                            groupName={
                                                selectedGroupForChat.name
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "discover-users" && (
                            <div className="p-6">
                                <UserDiscovery
                                    onSendMessage={(userId, userName) => {
                                        // Handle sending message to user
                                        console.log(
                                            `Send message to ${userName} (${userId})`
                                        );
                                        // You can implement chat opening logic here
                                    }}
                                />
                            </div>
                        )}

                        {activeTab === "profile" && (
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        Profile
                                    </h1>
                                    <button
                                        onClick={() =>
                                            router.push("/profile/edit")
                                        }
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                                    >
                                        Edit Profile
                                    </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-6">
                                        <div className="h-20 w-20 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-2xl font-medium text-white">
                                                {userProfile?.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() ||
                                                    session.user?.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() ||
                                                    "U"}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-medium text-gray-900">
                                                {userProfile?.name ||
                                                    session.user?.name}
                                            </h2>
                                            <p className="text-gray-600">
                                                {userProfile?.email ||
                                                    session.user?.email}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Student ID:{" "}
                                                {userProfile?.studentId ||
                                                    "Not set"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-6">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Academic Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Major
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {userProfile?.major ||
                                                        "Not set"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Semester
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {userProfile?.semester ||
                                                        "Not set"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    CGPA
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {userProfile?.cgpa ||
                                                        "Not set"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Member Since
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {userProfile?.createdAt
                                                        ? new Date(
                                                              userProfile.createdAt
                                                          ).toLocaleDateString()
                                                        : "Not set"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Enrolled Courses
                                                </label>
                                                <div className="mt-1">
                                                    {userProfile?.enrolledCourses &&
                                                    userProfile.enrolledCourses
                                                        .length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                            {userProfile.enrolledCourses.map(
                                                                (
                                                                    course,
                                                                    index
                                                                ) => (
                                                                    <span
                                                                        key={
                                                                            index
                                                                        }
                                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                                    >
                                                                        {course.trim()}
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-900">
                                                            Not set
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">
                                                    Interests
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900">
                                                    {userProfile?.interests &&
                                                    userProfile.interests
                                                        .length > 0
                                                        ? userProfile.interests.join(
                                                              ", "
                                                          )
                                                        : "Not set"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
