"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function EditProfile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [formData, setFormData] = useState({
        major: "",
        semester: "",
        cgpa: "",
        enrolledCourses: "",
        skills: "",
        interests: "",
        showCgpa: false,
        isProfilePublic: true,
    });

    useEffect(() => {
        if (status === "authenticated") {
            fetchProfile();
        }
    }, [status]);

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/profile", {
                credentials: "include",
            });
            if (response.ok) {
                const profileData = await response.json();
                setFormData({
                    major: profileData.major || "",
                    semester: profileData.semester?.toString() || "",
                    cgpa: profileData.cgpa?.toString() || "",
                    enrolledCourses: Array.isArray(profileData.enrolledCourses)
                        ? profileData.enrolledCourses.join(", ")
                        : profileData.enrolledCourses || "",
                    skills: Array.isArray(profileData.skills)
                        ? profileData.skills.join(", ")
                        : profileData.skills || "",
                    interests: Array.isArray(profileData.interests)
                        ? profileData.interests.join(", ")
                        : profileData.interests || "",
                    showCgpa: profileData.showCgpa || false,
                    isProfilePublic: profileData.isProfilePublic !== false,
                });
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setFetchLoading(false);
        }
    };

    if (status === "loading" || fetchLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        router.push("/auth/signin");
        return null;
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    major: formData.major,
                    semester: formData.semester,
                    cgpa: formData.cgpa,
                    enrolledCourses: formData.enrolledCourses,
                    skills: formData.skills,
                    interests: formData.interests,
                    showCgpa: formData.showCgpa,
                    isProfilePublic: formData.isProfilePublic,
                }),
            });

            if (!response.ok) {
                const errorData = await response
                    .json()
                    .catch(() => ({ error: "Unknown error" }));
                console.error("Profile update failed:", errorData);
                throw new Error(errorData.error || "Failed to update profile");
            }

            alert("Profile updated successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert(
                `Failed to update profile. ${
                    error instanceof Error ? error.message : "Please try again."
                }`
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg
                            className="h-6 w-6 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Edit Your Profile
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Update your academic information and preferences
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label
                                htmlFor="major"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Major/Program
                            </label>
                            <input
                                id="major"
                                name="major"
                                type="text"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., Computer Science, Business, Economics"
                                value={formData.major}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="semester"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Current Semester
                            </label>
                            <input
                                id="semester"
                                name="semester"
                                type="number"
                                min="1"
                                max="12"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., 6"
                                value={formData.semester}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="cgpa"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Current CGPA (Optional)
                            </label>
                            <input
                                id="cgpa"
                                name="cgpa"
                                type="number"
                                step="0.01"
                                min="0"
                                max="4.00"
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., 3.75"
                                value={formData.cgpa}
                                onChange={handleChange}
                            />
                            <div className="mt-2">
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        name="showCgpa"
                                        checked={formData.showCgpa}
                                        onChange={handleChange}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">
                                        Make CGPA visible to other students
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="enrolledCourses"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Currently Enrolled Courses
                            </label>
                            <textarea
                                id="enrolledCourses"
                                name="enrolledCourses"
                                rows={4}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter your current semester courses, one per line or separated by commas:&#10;&#10;CSE110 - Programming Language I&#10;MAT120 - Calculus I&#10;ENG101 - English Composition&#10;PHY101 - Physics I"
                                value={formData.enrolledCourses}
                                onChange={handleChange}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This helps us recommend relevant study groups
                                and resources. Include course codes and names
                                for better matching.
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="skills"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Skills & Expertise
                            </label>
                            <textarea
                                id="skills"
                                name="skills"
                                rows={2}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., Programming, Mathematics, Writing, Research"
                                value={formData.skills}
                                onChange={handleChange}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Help others find you for study partnerships
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="interests"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Academic Interests
                            </label>
                            <textarea
                                id="interests"
                                name="interests"
                                rows={2}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., Machine Learning, Finance, Environmental Science"
                                value={formData.interests}
                                onChange={handleChange}
                            />
                        </div>

                        <div>
                            <label className="inline-flex items-center">
                                <input
                                    type="checkbox"
                                    name="isProfilePublic"
                                    checked={formData.isProfilePublic}
                                    onChange={handleChange}
                                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                />
                                <span className="ml-2 text-sm text-gray-600">
                                    Make profile visible to other students
                                </span>
                            </label>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? "Updating..." : "Update Profile"}
                            </button>
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard")}
                                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
