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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    BarChart3,
    Plus,
    Vote,
    EyeOff,
    Clock,
    Users,
    TrendingUp,
    Calendar,
} from "lucide-react";

interface PollOption {
    id: string;
    text: string;
    votes: Array<{
        id: string;
        userId: string;
        pollId: string;
        optionId: string;
    }>;
    _count: {
        votes: number;
    };
}

interface Poll {
    id: string;
    title: string;
    description: string;
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO";
    isAnonymous: boolean;
    isClosed: boolean;
    expiresAt: string | null;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    options: PollOption[];
    _count: {
        votes: number;
    };
    votes?: { optionId: string }[]; // User's votes
}

interface PollProps {
    groupId: string;
    groupName: string;
}

export default function Poll({ groupId, groupName }: PollProps) {
    const { data: session } = useSession();
    const [polls, setPolls] = useState<Poll[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [isVoting, setIsVoting] = useState(false);

    // Form states for creating polls
    const [pollForm, setPollForm] = useState({
        title: "",
        description: "",
        options: ["", ""], // Start with 2 options
        isAnonymous: false,
        allowAddOptions: true,
        type: "SINGLE_CHOICE" as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "YES_NO",
        expiresAt: "",
    });

    const fetchPolls = useCallback(async () => {
        try {
            const response = await fetch(`/api/groups/${groupId}/polls`);

            if (response.ok) {
                const data = await response.json();
                setPolls(data);
            }
        } catch (error) {
            console.error("Error fetching polls:", error);
        } finally {
            setIsLoading(false);
        }
    }, [groupId]);

    useEffect(() => {
        fetchPolls();
    }, [fetchPolls]);

    const handleCreatePoll = async () => {
        try {
            const options = pollForm.options.filter(
                (option) => option.trim() !== ""
            );

            if (options.length < 2) {
                alert("Please provide at least 2 options");
                return;
            }

            const response = await fetch(`/api/groups/${groupId}/polls`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...pollForm,
                    options,
                    expiresAt: pollForm.expiresAt
                        ? new Date(pollForm.expiresAt).toISOString()
                        : null,
                }),
            });

            if (response.ok) {
                const newPoll = await response.json();
                setPolls((prev) => [newPoll, ...prev]);
                setShowCreateDialog(false);
                setPollForm({
                    title: "",
                    description: "",
                    options: ["", ""],
                    isAnonymous: false,
                    allowAddOptions: true,
                    type: "SINGLE_CHOICE",
                    expiresAt: "",
                });
            }
        } catch (error) {
            console.error("Error creating poll:", error);
        }
    };

    const handleClosePoll = async (pollId: string) => {
        try {
            const response = await fetch(
                `/api/groups/${groupId}/polls/${pollId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        isClosed: true,
                    }),
                }
            );

            if (response.ok) {
                const updatedPoll = await response.json();
                setPolls((prev) =>
                    prev.map((poll) =>
                        poll.id === pollId ? updatedPoll : poll
                    )
                );
            }
        } catch (error) {
            console.error("Error closing poll:", error);
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

    const isPollClosed = (poll: Poll) => {
        if (poll.isClosed) return true;
        if (poll.expiresAt) {
            return new Date(poll.expiresAt) < new Date();
        }
        return false;
    };

    const getTotalVotes = (poll: Poll) => {
        return poll.options.reduce(
            (total, option) => total + (option._count?.votes || 0),
            0
        );
    };

    const addOptionField = () => {
        setPollForm((prev) => ({
            ...prev,
            options: [...prev.options, ""],
        }));
    };

    const updateOptionField = (index: number, value: string) => {
        setPollForm((prev) => ({
            ...prev,
            options: prev.options.map((option, i) =>
                i === index ? value : option
            ),
        }));
    };

    const removeOptionField = (index: number) => {
        if (pollForm.options.length > 2) {
            setPollForm((prev) => ({
                ...prev,
                options: prev.options.filter((_, i) => i !== index),
            }));
        }
    };

    const handleVoteSelection = (optionId: string, isSelected: boolean) => {
        if (!selectedPoll) return;

        if (selectedPoll.type === "MULTIPLE_CHOICE") {
            if (isSelected) {
                setSelectedOptions((prev) => [...prev, optionId]);
            } else {
                setSelectedOptions((prev) =>
                    prev.filter((id) => id !== optionId)
                );
            }
        } else {
            // Single choice or Yes/No
            setSelectedOptions(isSelected ? [optionId] : []);
        }
    };

    const handleSubmitVote = async () => {
        if (!selectedPoll || selectedOptions.length === 0 || isVoting) return;

        setIsVoting(true);
        try {
            const response = await fetch(
                `/api/groups/${groupId}/polls/${selectedPoll.id}/vote`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        optionIds: selectedOptions,
                    }),
                }
            );

            if (response.ok) {
                // Refresh polls to get updated vote counts
                await fetchPolls();
                setSelectedPoll(null);
                setSelectedOptions([]);
            } else {
                const error = await response.json();
                alert(error.error || "Failed to submit vote");
            }
        } catch (error) {
            console.error("Error submitting vote:", error);
            alert("Failed to submit vote. Please try again.");
        } finally {
            setIsVoting(false);
        }
    };

    const hasUserVoted = (poll: Poll) => {
        return poll.votes && poll.votes.length > 0;
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
                    <h2 className="text-2xl font-bold text-gray-900">Polls</h2>
                    <p className="text-gray-600">
                        {groupName} - Create polls and gather opinions
                    </p>
                </div>

                <Dialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                >
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Poll
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create a Poll</DialogTitle>
                            <DialogDescription>
                                Gather opinions from your study group members.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="poll-title">Question</Label>
                                <Input
                                    id="poll-title"
                                    value={pollForm.title}
                                    onChange={(e) =>
                                        setPollForm((prev) => ({
                                            ...prev,
                                            title: e.target.value,
                                        }))
                                    }
                                    placeholder="What's your question?"
                                />
                            </div>

                            <div>
                                <Label htmlFor="poll-description">
                                    Description (Optional)
                                </Label>
                                <Textarea
                                    id="poll-description"
                                    value={pollForm.description}
                                    onChange={(e) =>
                                        setPollForm((prev) => ({
                                            ...prev,
                                            description: e.target.value,
                                        }))
                                    }
                                    placeholder="Provide additional context..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Options</Label>
                                <div className="space-y-2">
                                    {pollForm.options.map((option, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center space-x-2"
                                        >
                                            <Input
                                                value={option}
                                                onChange={(e) =>
                                                    updateOptionField(
                                                        index,
                                                        e.target.value
                                                    )
                                                }
                                                placeholder={`Option ${
                                                    index + 1
                                                }`}
                                            />
                                            {pollForm.options.length > 2 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        removeOptionField(index)
                                                    }
                                                >
                                                    Remove
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addOptionField}
                                    className="mt-2"
                                >
                                    Add Option
                                </Button>
                            </div>

                            <div>
                                <Label htmlFor="expires-at">
                                    Closing Date (Optional)
                                </Label>
                                <Input
                                    id="expires-at"
                                    type="datetime-local"
                                    value={pollForm.expiresAt}
                                    onChange={(e) =>
                                        setPollForm((prev) => ({
                                            ...prev,
                                            expiresAt: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label>Poll Type</Label>
                                    <div className="flex items-center space-x-6">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="single-choice-simple"
                                                name="poll-type-simple"
                                                value="SINGLE_CHOICE"
                                                checked={
                                                    pollForm.type ===
                                                    "SINGLE_CHOICE"
                                                }
                                                onChange={(e) =>
                                                    setPollForm((prev) => ({
                                                        ...prev,
                                                        type: e.target.value as
                                                            | "SINGLE_CHOICE"
                                                            | "MULTIPLE_CHOICE"
                                                            | "YES_NO",
                                                    }))
                                                }
                                                className="rounded"
                                            />
                                            <Label htmlFor="single-choice-simple">
                                                Single Choice
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="multiple-choice-simple"
                                                name="poll-type-simple"
                                                value="MULTIPLE_CHOICE"
                                                checked={
                                                    pollForm.type ===
                                                    "MULTIPLE_CHOICE"
                                                }
                                                onChange={(e) =>
                                                    setPollForm((prev) => ({
                                                        ...prev,
                                                        type: e.target.value as
                                                            | "SINGLE_CHOICE"
                                                            | "MULTIPLE_CHOICE"
                                                            | "YES_NO",
                                                    }))
                                                }
                                                className="rounded"
                                            />
                                            <Label htmlFor="multiple-choice-simple">
                                                Multiple Choice
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                id="yes-no-simple"
                                                name="poll-type-simple"
                                                value="YES_NO"
                                                checked={
                                                    pollForm.type === "YES_NO"
                                                }
                                                onChange={(e) =>
                                                    setPollForm((prev) => ({
                                                        ...prev,
                                                        type: e.target.value as
                                                            | "SINGLE_CHOICE"
                                                            | "MULTIPLE_CHOICE"
                                                            | "YES_NO",
                                                    }))
                                                }
                                                className="rounded"
                                            />
                                            <Label htmlFor="yes-no-simple">
                                                Yes/No
                                            </Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="anonymous-simple"
                                            checked={pollForm.isAnonymous}
                                            onChange={(e) =>
                                                setPollForm((prev) => ({
                                                    ...prev,
                                                    isAnonymous:
                                                        e.target.checked,
                                                }))
                                            }
                                            className="rounded"
                                        />
                                        <Label
                                            htmlFor="anonymous-simple"
                                            className="flex items-center space-x-1"
                                        >
                                            <EyeOff className="h-4 w-4" />
                                            <span>Anonymous poll</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="allow-add-options-simple"
                                            checked={pollForm.allowAddOptions}
                                            onChange={(e) =>
                                                setPollForm((prev) => ({
                                                    ...prev,
                                                    allowAddOptions:
                                                        e.target.checked,
                                                }))
                                            }
                                            className="rounded"
                                        />
                                        <Label
                                            htmlFor="allow-add-options-simple"
                                            className="flex items-center space-x-1"
                                        >
                                            <Plus className="h-4 w-4" />
                                            <span>
                                                Allow users to add options
                                            </span>
                                        </Label>
                                    </div>
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
                                    onClick={handleCreatePoll}
                                    disabled={
                                        !pollForm.title ||
                                        pollForm.options.filter((o) => o.trim())
                                            .length < 2
                                    }
                                >
                                    Create Poll
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Polls List */}
            <div className="space-y-4">
                {polls.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <Vote className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No polls yet
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Be the first to create a poll in this group!
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                Create First Poll
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    polls.map((poll) => (
                        <Card
                            key={poll.id}
                            className="hover:shadow-md transition-shadow"
                        >
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {poll.title}
                                            </h3>
                                            {poll.isAnonymous && (
                                                <EyeOff className="h-5 w-5 text-gray-400" />
                                            )}
                                            {isPollClosed(poll) && (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-gray-100 text-gray-800"
                                                >
                                                    Closed
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                            <div className="flex items-center space-x-1">
                                                {poll.isAnonymous ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {poll.user?.name
                                                                ?.charAt(0)
                                                                ?.toUpperCase() ||
                                                                "A"}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <span>
                                                    {poll.isAnonymous
                                                        ? "Anonymous"
                                                        : poll.user?.name ||
                                                          "Unknown"}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    {formatTime(poll.createdAt)}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Users className="h-4 w-4" />
                                                <span>
                                                    {getTotalVotes(poll)} votes
                                                </span>
                                            </div>
                                            {poll.expiresAt && (
                                                <div className="flex items-center space-x-1">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        Closes{" "}
                                                        {new Date(
                                                            poll.expiresAt
                                                        ).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {poll.description && (
                                            <p className="text-gray-700 mb-3">
                                                {poll.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setSelectedPoll(poll)
                                            }
                                        >
                                            View Results
                                        </Button>
                                        {!isPollClosed(poll) &&
                                            poll.user?.id ===
                                                session?.user?.id && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleClosePoll(poll.id)
                                                    }
                                                >
                                                    Close Poll
                                                </Button>
                                            )}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3">
                                    {poll.options.map((option) => {
                                        const percentage =
                                            getTotalVotes(poll) > 0
                                                ? ((option._count?.votes || 0) /
                                                      getTotalVotes(poll)) *
                                                  100
                                                : 0;

                                        return (
                                            <div
                                                key={option.id}
                                                className="space-y-1"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">
                                                        {option.text}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {option._count?.votes ||
                                                            0}{" "}
                                                        ({percentage.toFixed(1)}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Poll Details Dialog */}
            {selectedPoll && (
                <Dialog
                    open={!!selectedPoll}
                    onOpenChange={() => setSelectedPoll(null)}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>{selectedPoll.title}</span>
                                {isPollClosed(selectedPoll) && (
                                    <Badge
                                        variant="secondary"
                                        className="bg-gray-100 text-gray-800"
                                    >
                                        Closed
                                    </Badge>
                                )}
                            </DialogTitle>
                            <DialogDescription>
                                Created by{" "}
                                {selectedPoll.isAnonymous
                                    ? "Anonymous"
                                    : selectedPoll.user?.name || "Unknown"}{" "}
                                • {formatTime(selectedPoll.createdAt)}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {selectedPoll.description && (
                                <p className="text-gray-700">
                                    {selectedPoll.description}
                                </p>
                            )}

                            {/* Results */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>
                                        Results ({getTotalVotes(selectedPoll)}{" "}
                                        votes)
                                    </span>
                                </h4>

                                <div className="space-y-3">
                                    {selectedPoll.options.map((option) => {
                                        const percentage =
                                            getTotalVotes(selectedPoll) > 0
                                                ? ((option._count?.votes || 0) /
                                                      getTotalVotes(
                                                          selectedPoll
                                                      )) *
                                                  100
                                                : 0;

                                        return (
                                            <div
                                                key={option.id}
                                                className="space-y-1"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">
                                                        {option.text}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {option._count?.votes ||
                                                            0}{" "}
                                                        ({percentage.toFixed(1)}
                                                        %)
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-3">
                                                    <div
                                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${percentage}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
