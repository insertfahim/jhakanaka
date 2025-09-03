"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Search,
    Users,
    UserPlus,
    UserCheck,
    UserX,
    GraduationCap,
    BookOpen,
    Calendar,
    MessageCircle,
} from "lucide-react";

interface UserProfile {
    id: string;
    name: string | null;
    email: string;
    studentId: string | null;
    bio: string | null;
    avatar: string | null;
    department: string | null;
    year: number | null;
    interests: string[];
    isOnline: boolean;
    lastSeen: string;
    _count: {
        groups: number;
        connections: number;
    };
    groups: Array<{
        id: string;
        name: string;
        courseCode: string;
    }>;
    connectionStatus?: "none" | "pending" | "connected" | "blocked";
}

interface UserDiscoveryProps {
    onSendMessage?: (userId: string, userName: string) => void;
}

export default function UserDiscovery({ onSendMessage }: UserDiscoveryProps) {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [yearFilter, setYearFilter] = useState("");
    const [groupFilter, setGroupFilter] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (departmentFilter) params.append("department", departmentFilter);
            if (yearFilter) params.append("year", yearFilter);
            if (groupFilter) params.append("group", groupFilter);

            const response = await fetch(
                `/api/users/discovery?${params.toString()}`
            );

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, departmentFilter, yearFilter, groupFilter]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSendConnectionRequest = async (userId: string) => {
        try {
            const response = await fetch(`/api/users/connections`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    targetUserId: userId,
                }),
            });

            if (response.ok) {
                // Update the user's connection status
                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === userId
                            ? { ...user, connectionStatus: "pending" as const }
                            : user
                    )
                );
            }
        } catch (error) {
            console.error("Error sending connection request:", error);
        }
    };

    const handleCancelConnectionRequest = async (userId: string) => {
        try {
            const response = await fetch(`/api/users/connections/${userId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Update the user's connection status
                setUsers((prev) =>
                    prev.map((user) =>
                        user.id === userId
                            ? { ...user, connectionStatus: "none" as const }
                            : user
                    )
                );
            }
        } catch (error) {
            console.error("Error canceling connection request:", error);
        }
    };

    const getConnectionButtonIcon = (user: UserProfile) => {
        switch (user.connectionStatus) {
            case "connected":
                return <UserCheck className="h-4 w-4" />;
            case "pending":
                return <UserX className="h-4 w-4" />;
            case "blocked":
                return <UserX className="h-4 w-4" />;
            default:
                return <UserPlus className="h-4 w-4" />;
        }
    };

    const formatLastSeen = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60)
        );

        if (diffInMinutes < 1) return "Just now";
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    const getDepartments = () => {
        const departments = new Set<string>();
        users.forEach((user) => {
            if (user.department) departments.add(user.department);
        });
        return Array.from(departments);
    };

    const getYears = () => {
        const years = new Set<number>();
        users.forEach((user) => {
            if (user.year) years.add(user.year);
        });
        return Array.from(years).sort((a, b) => b - a);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        Discover Users
                    </h2>
                    <p className="text-gray-600">
                        Find and connect with fellow BRACU students
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select
                            value={departmentFilter}
                            onValueChange={setDepartmentFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">
                                    All Departments
                                </SelectItem>
                                {getDepartments().map((dept) => (
                                    <SelectItem key={dept} value={dept}>
                                        {dept}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={yearFilter}
                            onValueChange={setYearFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Years</SelectItem>
                                {getYears().map((year) => (
                                    <SelectItem
                                        key={year}
                                        value={year.toString()}
                                    >
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={groupFilter}
                            onValueChange={setGroupFilter}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Study Group" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Groups</SelectItem>
                                <SelectItem value="shared">
                                    Shared Groups
                                </SelectItem>
                                <SelectItem value="none">No Groups</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No users found
                        </h3>
                        <p className="text-gray-600">
                            Try adjusting your search criteria or filters.
                        </p>
                    </div>
                ) : (
                    users.map((user) => (
                        <Card
                            key={user.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage
                                                    src={user.avatar || ""}
                                                />
                                                <AvatarFallback>
                                                    {user.name
                                                        ?.charAt(0)
                                                        ?.toUpperCase() || "U"}
                                                </AvatarFallback>
                                            </Avatar>
                                            {user.isOnline && (
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {user.name || "Anonymous"}
                                            </CardTitle>
                                            <p className="text-sm text-gray-600">
                                                {user.studentId
                                                    ? `ID: ${user.studentId}`
                                                    : user.email}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {user.isOnline
                                                    ? "Online"
                                                    : `Last seen ${formatLastSeen(
                                                          user.lastSeen
                                                      )}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {/* Department and Year */}
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center space-x-1">
                                        <GraduationCap className="h-4 w-4 text-gray-400" />
                                        <span>
                                            {user.department || "No Department"}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Calendar className="h-4 w-4 text-gray-400" />
                                        <span>
                                            {user.year
                                                ? `Year ${user.year}`
                                                : "No Year"}
                                        </span>
                                    </div>
                                </div>

                                {/* Bio */}
                                {user.bio && (
                                    <p className="text-sm text-gray-700 line-clamp-2">
                                        {user.bio}
                                    </p>
                                )}

                                {/* Interests */}
                                {user.interests.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {user.interests
                                            .slice(0, 3)
                                            .map((interest) => (
                                                <Badge
                                                    key={interest}
                                                    variant="secondary"
                                                    className="text-xs"
                                                >
                                                    {interest}
                                                </Badge>
                                            ))}
                                        {user.interests.length > 3 && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                            >
                                                +{user.interests.length - 3}{" "}
                                                more
                                            </Badge>
                                        )}
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{user._count.groups} groups</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Users className="h-4 w-4" />
                                        <span>
                                            {user._count.connections}{" "}
                                            connections
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => setSelectedUser(user)}
                                    >
                                        View Profile
                                    </Button>

                                    {user.connectionStatus === "connected" ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                onSendMessage?.(
                                                    user.id,
                                                    user.name || "User"
                                                )
                                            }
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                    ) : user.connectionStatus === "pending" ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                handleCancelConnectionRequest(
                                                    user.id
                                                )
                                            }
                                        >
                                            {getConnectionButtonIcon(user)}
                                        </Button>
                                    ) : user.connectionStatus === "none" ? (
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleSendConnectionRequest(
                                                    user.id
                                                )
                                            }
                                        >
                                            {getConnectionButtonIcon(user)}
                                        </Button>
                                    ) : null}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* User Profile Dialog */}
            {selectedUser && (
                <Dialog
                    open={!!selectedUser}
                    onOpenChange={() => setSelectedUser(null)}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center space-x-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage
                                        src={selectedUser.avatar || ""}
                                    />
                                    <AvatarFallback className="text-lg">
                                        {selectedUser.name
                                            ?.charAt(0)
                                            ?.toUpperCase() || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="text-2xl font-bold">
                                        {selectedUser.name || "Anonymous"}
                                    </h2>
                                    <p className="text-gray-600">
                                        {selectedUser.studentId
                                            ? `Student ID: ${selectedUser.studentId}`
                                            : selectedUser.email}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                        {selectedUser.isOnline ? (
                                            <Badge
                                                variant="secondary"
                                                className="bg-green-100 text-green-800"
                                            >
                                                Online
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">
                                                Last seen{" "}
                                                {formatLastSeen(
                                                    selectedUser.lastSeen
                                                )}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Bio */}
                            {selectedUser.bio && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        About
                                    </h3>
                                    <p className="text-gray-700">
                                        {selectedUser.bio}
                                    </p>
                                </div>
                            )}

                            {/* Academic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Department
                                    </h3>
                                    <p className="text-gray-700">
                                        {selectedUser.department ||
                                            "Not specified"}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Year
                                    </h3>
                                    <p className="text-gray-700">
                                        {selectedUser.year
                                            ? `Year ${selectedUser.year}`
                                            : "Not specified"}
                                    </p>
                                </div>
                            </div>

                            {/* Interests */}
                            {selectedUser.interests.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Interests
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedUser.interests.map(
                                            (interest) => (
                                                <Badge
                                                    key={interest}
                                                    variant="secondary"
                                                >
                                                    {interest}
                                                </Badge>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Study Groups */}
                            {selectedUser.groups.length > 0 && (
                                <div>
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Study Groups
                                    </h3>
                                    <div className="space-y-2">
                                        {selectedUser.groups.map((group) => (
                                            <div
                                                key={group.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {group.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {group.courseCode}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                        {selectedUser._count.groups}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Study Groups
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                        {selectedUser._count.connections}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Connections
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                        {selectedUser.interests.length}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Interests
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                                {selectedUser.connectionStatus ===
                                "connected" ? (
                                    <>
                                        <Button
                                            className="flex-1"
                                            onClick={() =>
                                                onSendMessage?.(
                                                    selectedUser.id,
                                                    selectedUser.name || "User"
                                                )
                                            }
                                        >
                                            <MessageCircle className="h-4 w-4 mr-2" />
                                            Send Message
                                        </Button>
                                    </>
                                ) : selectedUser.connectionStatus ===
                                  "pending" ? (
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() =>
                                            handleCancelConnectionRequest(
                                                selectedUser.id
                                            )
                                        }
                                    >
                                        <UserX className="h-4 w-4 mr-2" />
                                        Cancel Request
                                    </Button>
                                ) : selectedUser.connectionStatus === "none" ? (
                                    <Button
                                        className="flex-1"
                                        onClick={() =>
                                            handleSendConnectionRequest(
                                                selectedUser.id
                                            )
                                        }
                                    >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Send Connection Request
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
