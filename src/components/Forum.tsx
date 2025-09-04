"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    MessageSquare,
    Plus,
    Search,
    EyeOff,
    AlertTriangle,
    MessageCircle,
    Clock,
} from "lucide-react";

interface ForumPost {
    id: string;
    title: string;
    content: string;
    tags: string[];
    isAnonymous: boolean;
    isUrgent: boolean;
    isResolved: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    replies: Array<{
        id: string;
        content: string;
        isAnonymous: boolean;
        createdAt: string;
        user: {
            id: string;
            name: string | null;
            email: string;
        } | null;
    }>;
    _count: {
        replies: number;
    };
}

interface ForumProps {
    groupId: string;
    groupName: string;
}

export default function Forum({ groupId, groupName }: ForumProps) {
    const { data: session } = useSession();
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string>("all");
    const [resolvedFilter, setResolvedFilter] = useState<string>("all");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
    const [replyContent, setReplyContent] = useState("");

    // Form states for creating posts
    const [postForm, setPostForm] = useState({
        title: "",
        content: "",
        tags: [] as string[],
        isAnonymous: false,
        isUrgent: false,
    });

    const fetchPosts = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (selectedTag && selectedTag !== "all")
                params.append("tag", selectedTag);
            if (resolvedFilter && resolvedFilter !== "all")
                params.append("resolved", resolvedFilter);

            const response = await fetch(
                `/api/groups/${groupId}/forum?${params.toString()}`
            );

            if (response.ok) {
                const data = await response.json();
                setPosts(data);
            }
        } catch (error) {
            console.error("Error fetching posts:", error);
        } finally {
            setIsLoading(false);
        }
    }, [groupId, searchQuery, selectedTag, resolvedFilter]);

    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const handleCreatePost = async () => {
        try {
            const response = await fetch(`/api/groups/${groupId}/forum`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(postForm),
            });

            if (response.ok) {
                const newPost = await response.json();
                setPosts((prev) => [newPost, ...prev]);
                setShowCreateDialog(false);
                setPostForm({
                    title: "",
                    content: "",
                    tags: [],
                    isAnonymous: false,
                    isUrgent: false,
                });
            }
        } catch (error) {
            console.error("Error creating post:", error);
        }
    };

    const handleCreateReply = async (postId: string) => {
        if (!replyContent.trim()) return;

        try {
            const response = await fetch(
                `/api/groups/${groupId}/forum/${postId}/replies`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: replyContent,
                        isAnonymous: false, // Could add anonymous reply option later
                    }),
                }
            );

            if (response.ok) {
                const newReply = await response.json();
                setPosts((prev) =>
                    prev.map((post) =>
                        post.id === postId
                            ? {
                                  ...post,
                                  replies: [...post.replies, newReply],
                                  _count: {
                                      ...post._count,
                                      replies: post._count.replies + 1,
                                  },
                              }
                            : post
                    )
                );
                setReplyContent("");
            }
        } catch (error) {
            console.error("Error creating reply:", error);
        }
    };

    const handleMarkResolved = async (postId: string, resolved: boolean) => {
        try {
            const response = await fetch(
                `/api/groups/${groupId}/forum/${postId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ isResolved: resolved }),
                }
            );

            if (response.ok) {
                setPosts((prev) =>
                    prev.map((post) =>
                        post.id === postId
                            ? { ...post, isResolved: resolved }
                            : post
                    )
                );
            }
        } catch (error) {
            console.error("Error updating post:", error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor(
            (now.getTime() - date.getTime()) / (1000 * 60 * 60)
        );

        if (diffInHours < 1) return "Just now";
        if (diffInHours < 24) return `${diffInHours}h ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;

        return date.toLocaleDateString();
    };

    const getAllTags = () => {
        const tags = new Set<string>();
        posts.forEach((post) => {
            post.tags.forEach((tag) => tags.add(tag));
        });
        return Array.from(tags);
    };

    const addTag = (tag: string) => {
        if (tag && !postForm.tags.includes(tag)) {
            setPostForm((prev) => ({
                ...prev,
                tags: [...prev.tags, tag],
            }));
        }
    };

    const removeTag = (tagToRemove: string) => {
        setPostForm((prev) => ({
            ...prev,
            tags: prev.tags.filter((tag) => tag !== tagToRemove),
        }));
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
                        Q&A Forum
                    </h2>
                    <p className="text-gray-600">
                        {groupName} - Ask questions and share knowledge
                    </p>
                </div>

                <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Ask Question
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Ask a Question</DialogTitle>
                            <DialogDescription>
                                Post your question to get help from fellow
                                students.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="title">Question Title</Label>
                                <Input
                                    id="title"
                                    value={postForm.title}
                                    onChange={(e) =>
                                        setPostForm((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="What's your question?"
                                />
                            </div>

                            <div>
                                <Label htmlFor="content">Description</Label>
                                <Textarea
                                    id="content"
                                    value={postForm.content}
                                    onChange={(e) =>
                                        setPostForm((prev) => ({
                                            ...prev,
                                            content: e.target.value,
                                        }))
                                    }
                                    placeholder="Provide more details about your question..."
                                    rows={6}
                                />
                            </div>

                            <div>
                                <Label htmlFor="tags">Tags</Label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {postForm.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="flex items-center gap-1"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="ml-1 text-gray-500 hover:text-gray-700"
                                            >
                                                ×
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                                <Input
                                    placeholder="Add tags (press Enter)"
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            const input =
                                                e.target as HTMLInputElement;
                                            addTag(input.value.trim());
                                            input.value = "";
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={postForm.isAnonymous}
                                        onChange={(e) =>
                                            setPostForm((prev) => ({
                                                ...prev,
                                                isAnonymous: e.target.checked,
                                            }))
                                        }
                                        className="rounded"
                                    />
                                    <Label
                                        htmlFor="anonymous"
                                        className="flex items-center space-x-1"
                                    >
                                        <EyeOff className="h-4 w-4" />
                                        <span>Post anonymously</span>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="urgent"
                                        checked={postForm.isUrgent}
                                        onChange={(e) =>
                                            setPostForm((prev) => ({
                                                ...prev,
                                                isUrgent: e.target.checked,
                                            }))
                                        }
                                        className="rounded"
                                    />
                                    <Label
                                        htmlFor="urgent"
                                        className="flex items-center space-x-1"
                                    >
                                        <AlertTriangle className="h-4 w-4 text-red-500" />
                                        <span>Mark as urgent</span>
                                    </Label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateDialog(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreatePost}
                                    disabled={
                                        !postForm.title || !postForm.content
                                    }
                                >
                                    Post Question
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-10"
                                />
                            </div>
                        </div>

                        <Select
                            value={selectedTag}
                            onValueChange={setSelectedTag}
                        >
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Filter by tag" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All tags</SelectItem>
                                {getAllTags().map((tag) => (
                                    <SelectItem key={tag} value={tag}>
                                        {tag}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={resolvedFilter}
                            onValueChange={setResolvedFilter}
                        >
                            <SelectTrigger className="w-full sm:w-32">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="false">Open</SelectItem>
                                <SelectItem value="true">Resolved</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Posts List */}
            <div className="space-y-4">
                {posts.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No questions yet
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Be the first to ask a question in this group!
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                Ask First Question
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    posts.map((post) => (
                        <Card
                            key={post.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {post.title}
                                            </h3>
                                            {post.isUrgent && (
                                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                            )}
                                            {post.isResolved && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-green-100 text-green-800"
                                                >
                                                    Resolved
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                            <div className="flex items-center space-x-1">
                                                {post.isAnonymous ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {post.user?.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "A"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <span>
                                                    {post.isAnonymous
                                                        ? "Anonymous"
                                                        : post.user?.name ||
                                                          "Unknown"}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {formatTime(post.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <MessageCircle className="h-4 w-4" />
                                                <span>
                                                    {post._count.replies}{" "}
                                                    replies
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {post.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                    className="text-xs"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex space-x-2">
                                        {!post.isResolved &&
                                            post.user?.id ===
                                                session?.user?.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleMarkResolved(
                                                            post.id,
                                                            true
                                                        )
                                                    }
                                                >
                                                    Mark Resolved
                                                </Button>
                                            )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setSelectedPost(post)
                                            }
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <p className="text-gray-700 line-clamp-3">
                                    {post.content}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Post Details Dialog */}
            {selectedPost && (
                <Dialog
                    open={!!selectedPost}
                    onOpenChange={() => setSelectedPost(null)}
                >
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                                {selectedPost.isUrgent && (
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                )}
                                <span>{selectedPost.title}</span>
                                {selectedPost.isResolved && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-800"
                                    >
                                        Resolved
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                Posted by{" "}
                                {selectedPost.isAnonymous
                                    ? "Anonymous"
                                    : selectedPost.user?.name || "Unknown"}{" "}
                                • {formatTime(selectedPost.createdAt)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Question Content */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap">
                                    {selectedPost.content}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {selectedPost.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Replies */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-4">
                                    Replies ({selectedPost.replies.length})
                                </h4>

                                <div className="space-y-4">
                                    {selectedPost.replies.map((reply) => (
                                        <div
                                            key={reply.id}
                                            className="border-l-2 border-gray-200 pl-4"
                                        >
                                            <div className="flex items-center space-x-2 mb-2">
                                                {reply.isAnonymous ? (
                                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                                ) : (
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {reply.user?.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "A"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <span className="text-sm font-medium">
                                                    {reply.isAnonymous
                                                        ? "Anonymous"
                                                        : reply.user?.name ||
                                                          "Unknown"}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatTime(
                                                        reply.createdAt
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">
                                                {reply.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Reply */}
                                <div className="mt-6">
                                    <Label htmlFor="reply">Add a reply</Label>
                                    <Textarea
                                        id="reply"
                                        value={replyContent}
                                        onChange={(e) =>
                                            setReplyContent(e.target.value)
                                        }
                                        placeholder="Share your thoughts or answer..."
                                        rows={3}
                                        className="mt-2"
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button
                                            onClick={() =>
                                                handleCreateReply(
                                                    selectedPost.id
                                                )
                                            }
                                            disabled={!replyContent.trim()}
                                            size="sm"
                                        >
                                            Post Reply
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
