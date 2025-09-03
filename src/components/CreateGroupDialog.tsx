"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateGroupDialogProps {
    children: React.ReactNode;
    onGroupCreated?: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function CreateGroupDialog({
    children,
    onGroupCreated,
    open: controlledOpen,
    onOpenChange,
}: CreateGroupDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Use controlled open if provided, otherwise use internal state
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        courseCode: "",
        courseName: "",
        maxMembers: "50",
        isPrivate: false,
        allowAnonymous: true,
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value, type } = e.target;
        if (type === "checkbox") {
            setFormData((prev) => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked,
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    maxMembers: parseInt(formData.maxMembers),
                }),
            });

            if (response.ok) {
                setOpen(false);
                setFormData({
                    name: "",
                    description: "",
                    courseCode: "",
                    courseName: "",
                    maxMembers: "50",
                    isPrivate: false,
                    allowAnonymous: true,
                });
                onGroupCreated?.();
            } else {
                console.error("Failed to create group");
            }
        } catch (error) {
            console.error("Error creating group:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Study Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Group Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g., CSE110 Study Group"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="courseCode">Course Code</Label>
                        <Input
                            id="courseCode"
                            name="courseCode"
                            placeholder="e.g., CSE110"
                            value={formData.courseCode}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="courseName">Course Name</Label>
                        <Input
                            id="courseName"
                            name="courseName"
                            placeholder="e.g., Programming Language I"
                            value={formData.courseName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description (Optional)
                        </Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe what this study group is about..."
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="maxMembers">Maximum Members</Label>
                        <Select
                            value={formData.maxMembers}
                            onValueChange={(value) =>
                                handleSelectChange("maxMembers", value)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select max members" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 members</SelectItem>
                                <SelectItem value="25">25 members</SelectItem>
                                <SelectItem value="50">50 members</SelectItem>
                                <SelectItem value="100">100 members</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="isPrivate"
                            name="isPrivate"
                            checked={formData.isPrivate}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <Label htmlFor="isPrivate" className="text-sm">
                            Private group (invite-only)
                        </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="allowAnonymous"
                            name="allowAnonymous"
                            checked={formData.allowAnonymous}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <Label htmlFor="allowAnonymous" className="text-sm">
                            Allow anonymous questions in forum
                        </Label>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Creating..." : "Create Group"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
