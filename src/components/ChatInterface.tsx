"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Send,
    AlertTriangle,
    Download,
    Image as ImageIcon,
    File,
} from "lucide-react";
import Image from "next/image";
import FileUpload from "@/components/FileUpload";

interface Message {
    id: string;
    content: string;
    type: "TEXT" | "IMAGE" | "FILE" | "SYSTEM";
    isUrgent: boolean;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
}

interface ChatInterfaceProps {
    groupId: string;
    groupName: string;
}

export default function ChatInterface({
    groupId,
    groupName,
}: ChatInterfaceProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUrgent, setIsUrgent] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchMessages = useCallback(async () => {
        try {
            const response = await fetch(`/api/groups/${groupId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, [groupId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() && !selectedFile) return;

        setIsLoading(true);
        try {
            let response;

            if (selectedFile) {
                // Send message with file
                const formData = new FormData();
                formData.append("file", selectedFile);
                formData.append("content", newMessage || selectedFile.name);
                formData.append("isUrgent", isUrgent.toString());

                response = await fetch(
                    `/api/groups/${groupId}/messages/files`,
                    {
                        method: "POST",
                        body: formData,
                    }
                );
            } else {
                // Send text message
                response = await fetch(`/api/groups/${groupId}/messages`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        content: newMessage,
                        type: "TEXT",
                        isUrgent,
                    }),
                });
            }

            if (response.ok) {
                const message = await response.json();
                setMessages((prev) => [...prev, message]);
                setNewMessage("");
                setSelectedFile(null);
                setIsUrgent(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const getFileIcon = (message: Message) => {
        if (message.type === "IMAGE") {
            return <ImageIcon className="h-4 w-4" />;
        }
        return <File className="h-4 w-4" />;
    };

    const handleFileDownload = (fileUrl: string, fileName: string) => {
        const link = document.createElement("a");
        link.href = fileUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="h-[600px] flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">{groupName} - Chat</CardTitle>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <p>No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex items-start space-x-3 ${
                                    message.user.id === session?.user?.id
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                {message.user.id !== session?.user?.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {message.user.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}

                                <div
                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                        message.user.id === session?.user?.id
                                            ? "bg-blue-500 text-white"
                                            : "bg-gray-100 text-gray-900"
                                    }`}
                                >
                                    {message.user.id !== session?.user?.id && (
                                        <div className="text-xs font-medium mb-1">
                                            {message.user.name}
                                            {message.isUrgent && (
                                                <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />
                                            )}
                                        </div>
                                    )}

                                    {message.type === "IMAGE" &&
                                    message.fileUrl ? (
                                        <div className="space-y-2">
                                            <div className="relative w-full max-w-sm">
                                                <Image
                                                    src={message.fileUrl}
                                                    alt={
                                                        message.fileName ||
                                                        "Image"
                                                    }
                                                    width={300}
                                                    height={200}
                                                    className="rounded cursor-pointer object-cover"
                                                    onClick={() =>
                                                        handleFileDownload(
                                                            message.fileUrl!,
                                                            message.fileName!
                                                        )
                                                    }
                                                />
                                            </div>
                                            {message.content && (
                                                <p className="text-sm">
                                                    {message.content}
                                                </p>
                                            )}
                                        </div>
                                    ) : message.type === "FILE" &&
                                      message.fileUrl ? (
                                        <div className="space-y-2">
                                            <div
                                                className="flex items-center space-x-2 p-2 bg-white bg-opacity-20 rounded cursor-pointer hover:bg-opacity-30"
                                                onClick={() =>
                                                    handleFileDownload(
                                                        message.fileUrl!,
                                                        message.fileName!
                                                    )
                                                }
                                            >
                                                {getFileIcon(message)}
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {message.fileName}
                                                    </p>
                                                    <p className="text-xs">
                                                        {message.fileSize
                                                            ? formatFileSize(
                                                                  message.fileSize
                                                              )
                                                            : ""}
                                                    </p>
                                                </div>
                                                <Download className="h-4 w-4" />
                                            </div>
                                            {message.content &&
                                                message.content !==
                                                    message.fileName && (
                                                    <p className="text-sm">
                                                        {message.content}
                                                    </p>
                                                )}
                                        </div>
                                    ) : (
                                        <p className="text-sm">
                                            {message.content}
                                        </p>
                                    )}

                                    <div className="text-xs mt-1 opacity-70">
                                        {formatTime(message.createdAt)}
                                        {message.isUrgent &&
                                            message.user.id ===
                                                session?.user?.id && (
                                                <AlertTriangle className="h-3 w-3 inline ml-1" />
                                            )}
                                    </div>
                                </div>

                                {message.user.id === session?.user?.id && (
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback>
                                            {session.user?.name
                                                ?.charAt(0)
                                                ?.toUpperCase() || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input Area */}
                <div className="border-t p-4 space-y-3">
                    {/* File Upload */}
                    <FileUpload
                        onFileSelect={setSelectedFile}
                        onFileRemove={() => setSelectedFile(null)}
                        selectedFile={selectedFile}
                        className="mb-3"
                    />

                    {/* Urgent Message Toggle */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="urgent"
                            checked={isUrgent}
                            onChange={(e) => setIsUrgent(e.target.checked)}
                            className="rounded"
                        />
                        <label
                            htmlFor="urgent"
                            className="text-sm flex items-center space-x-1"
                        >
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <span>Mark as urgent</span>
                        </label>
                    </div>

                    {/* Message Input */}
                    <div className="flex space-x-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            className="flex-1"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={
                                isLoading ||
                                (!newMessage.trim() && !selectedFile)
                            }
                            size="sm"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
