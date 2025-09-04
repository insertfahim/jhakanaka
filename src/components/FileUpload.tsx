"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, File, Image as ImageIcon } from "lucide-react";

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    onFileRemove: () => void;
    selectedFile: File | null;
    accept?: string;
    maxSize?: number; // in MB
    className?: string;
}

export default function FileUpload({
    onFileSelect,
    onFileRemove,
    selectedFile,
    accept = "image/*,.pdf,.doc,.docx,.txt,.zip,.rar",
    maxSize = 10,
    className = "",
}: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file size
            if (file.size > maxSize * 1024 * 1024) {
                alert(`File size must be less than ${maxSize}MB`);
                return;
            }
            onFileSelect(file);
        }
    };

    const handleRemove = () => {
        onFileRemove();
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith("image/")) {
            return <ImageIcon className="h-8 w-8 text-blue-500" />;
        }
        return <File className="h-8 w-8 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor="file-upload">Attach File</Label>

            {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="mb-2"
                            >
                                Choose File
                            </Button>
                            <p className="text-sm text-gray-500">
                                or drag and drop
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Max size: {maxSize}MB
                            </p>
                        </div>
                    </div>
                    <Input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        accept={accept}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>
            ) : (
                <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {getFileIcon(selectedFile)}
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemove}
                            className="text-red-500 hover:text-red-700"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
