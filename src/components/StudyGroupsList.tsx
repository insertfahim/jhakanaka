"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface StudyGroup {
    id: string;
    name: string;
    description: string | null;
    courseCode: string;
    courseName: string;
    maxMembers: number;
    isPrivate: boolean;
    allowAnonymous: boolean;
    createdAt: string;
    owner: {
        id: string;
        name: string | null;
        email: string;
    };
    _count: {
        members: number;
    };
    isMember: boolean;
    memberRole: string | null;
}

interface StudyGroupsListProps {
    searchQuery?: string;
    courseFilter?: string;
    onGroupUpdate?: () => void;
}

export default function StudyGroupsList({
    searchQuery,
    courseFilter,
    onGroupUpdate,
}: StudyGroupsListProps) {
    const { data: session } = useSession();
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningGroup, setJoiningGroup] = useState<string | null>(null);

    const fetchGroups = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (courseFilter) params.append("courseCode", courseFilter);

            const response = await fetch(`/api/groups?${params}`);
            if (response.ok) {
                const data = await response.json();
                setGroups(data);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, courseFilter]);

    useEffect(() => {
        fetchGroups();
    }, [searchQuery, courseFilter, fetchGroups]);

    const handleJoinGroup = async (groupId: string) => {
        if (!session?.user?.id) return;

        setJoiningGroup(groupId);
        try {
            const response = await fetch(`/api/groups/${groupId}/join`, {
                method: "POST",
            });

            if (response.ok) {
                await fetchGroups();
                onGroupUpdate?.();
            } else {
                const error = await response.json();
                alert(error.error || "Failed to join group");
            }
        } catch (error) {
            console.error("Error joining group:", error);
            alert("Failed to join group");
        } finally {
            setJoiningGroup(null);
        }
    };

    const handleLeaveGroup = async (groupId: string) => {
        if (!session?.user?.id) return;

        setJoiningGroup(groupId);
        try {
            const response = await fetch(`/api/groups/${groupId}/join`, {
                method: "DELETE",
            });

            if (response.ok) {
                await fetchGroups();
                onGroupUpdate?.();
            } else {
                const error = await response.json();
                alert(error.error || "Failed to leave group");
            }
        } catch (error) {
            console.error("Error leaving group:", error);
            alert("Failed to leave group");
        } finally {
            setJoiningGroup(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="text-center py-12">
                <svg
                    className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No study groups found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    {searchQuery || courseFilter
                        ? "Try adjusting your search criteria."
                        : "Be the first to create a study group!"}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {groups.map((group) => (
                <Card
                    key={group.id}
                    className="hover:shadow-md transition-shadow"
                >
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-lg">
                                    {group.name}
                                </CardTitle>
                                <CardDescription className="flex items-center space-x-2 mt-1">
                                    <span className="font-medium text-blue-600">
                                        {group.courseCode}
                                    </span>
                                    <span>•</span>
                                    <span>{group.courseName}</span>
                                </CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                {group.isPrivate && (
                                    <Badge variant="secondary">Private</Badge>
                                )}
                                {group.isMember && (
                                    <Badge variant="default">Member</Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {group.description && (
                                <p className="text-gray-600 text-sm">
                                    {group.description}
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <Avatar className="h-5 w-5">
                                            <AvatarFallback className="text-xs">
                                                {group.owner.name
                                                    ?.charAt(0)
                                                    ?.toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>
                                            by {group.owner.name || "Anonymous"}
                                        </span>
                                    </div>
                                    <span>
                                        {group._count.members}/
                                        {group.maxMembers} members
                                    </span>
                                    <span>
                                        {new Date(
                                            group.createdAt
                                        ).toLocaleDateString()}
                                    </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {!group.isMember ? (
                                        <Button
                                            onClick={() =>
                                                handleJoinGroup(group.id)
                                            }
                                            disabled={
                                                joiningGroup === group.id ||
                                                group._count.members >=
                                                    group.maxMembers
                                            }
                                            size="sm"
                                        >
                                            {joiningGroup === group.id
                                                ? "Joining..."
                                                : "Join Group"}
                                        </Button>
                                    ) : (
                                        group.memberRole !== "OWNER" && (
                                            <Button
                                                onClick={() =>
                                                    handleLeaveGroup(group.id)
                                                }
                                                disabled={
                                                    joiningGroup === group.id
                                                }
                                                variant="outline"
                                                size="sm"
                                            >
                                                {joiningGroup === group.id
                                                    ? "Leaving..."
                                                    : "Leave Group"}
                                            </Button>
                                        )
                                    )}

                                    {group.isMember && (
                                        <Link href={`/dashboard/group/${group.id}`} passHref>
                                            <Button variant="outline" size="sm">
                                                View Group
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {group.allowAnonymous && (
                                <div className="text-xs text-gray-500 flex items-center">
                                    <svg
                                        className="h-3 w-3 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                                        />
                                    </svg>
                                    Anonymous questions allowed
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
