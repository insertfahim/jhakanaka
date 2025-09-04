"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, Camera } from "lucide-react";

interface AvatarSelectorProps {
    currentAvatar?: string;
    onAvatarChange: (avatarUrl: string) => void;
    className?: string;
    userName?: string | null;
}

const DEFAULT_AVATARS = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    "https://api.dicebear.com/7.x/bottts/svg?seed=sam",
    "https://api.dicebear.com/7.x/identicon/svg?seed=jordan",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=taylor",
    "https://api.dicebear.com/7.x/personas/svg?seed=morgan",
    "https://api.dicebear.com/7.x/lorelei/svg?seed=casey",
];

export default function AvatarSelector({
    currentAvatar,
    onAvatarChange,
    className = "",
    userName,
}: AvatarSelectorProps) {
    const [selectedAvatar, setSelectedAvatar] = useState<string>(
        currentAvatar || ""
    );
    const [uploading, setUploading] = useState(false);
    const [customAvatar, setCustomAvatar] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDefaultAvatarSelect = (avatarUrl: string) => {
        setSelectedAvatar(avatarUrl);
        setCustomAvatar(null);
        onAvatarChange(avatarUrl);
    };

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file");
            return;
        }

        // Validate file size (max 5MB for avatars)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB");
            return;
        }

        setCustomAvatar(file);
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            const avatarUrl = data.fileUrl;
            setSelectedAvatar(avatarUrl);
            onAvatarChange(avatarUrl);
        } catch (error) {
            console.error("Error uploading avatar:", error);
            alert("Failed to upload avatar. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveCustomAvatar = () => {
        setCustomAvatar(null);
        setSelectedAvatar("");
        onAvatarChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getInitials = (name?: string | null) => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className={`space-y-4 ${className}`}>
            <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                    <Avatar className="w-24 h-24">
                        <AvatarImage
                            src={selectedAvatar}
                            alt="Profile avatar"
                        />
                        <AvatarFallback className="text-lg">
                            {getInitials(userName)}
                        </AvatarFallback>
                    </Avatar>
                    {selectedAvatar && (
                        <button
                            type="button"
                            onClick={handleRemoveCustomAvatar}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Choose Your Avatar
                    </h3>
                    <p className="text-sm text-gray-600">
                        Select from our collection or upload your own
                    </p>
                </div>
            </div>

            {/* Default Avatars */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Default Avatars
                </h4>
                <div className="grid grid-cols-3 gap-3">
                    {DEFAULT_AVATARS.map((avatarUrl, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleDefaultAvatarSelect(avatarUrl)}
                            className={`relative rounded-full overflow-hidden border-2 transition-all ${
                                selectedAvatar === avatarUrl
                                    ? "border-blue-500 ring-2 ring-blue-200"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <Avatar className="w-16 h-16">
                                <AvatarImage
                                    src={avatarUrl}
                                    alt={`Avatar ${index + 1}`}
                                />
                                <AvatarFallback className="text-xs">
                                    {index + 1}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Upload */}
            <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Or Upload Your Own
                </h4>
                <div className="flex items-center space-x-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center space-x-2"
                    >
                        <Camera className="w-4 h-4" />
                        <span>
                            {uploading ? "Uploading..." : "Choose Image"}
                        </span>
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                    {customAvatar && (
                        <span className="text-sm text-gray-600">
                            {customAvatar.name}
                        </span>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Max size: 5MB. Supported formats: JPG, PNG, GIF, WebP
                </p>
            </div>
        </div>
    );
}
