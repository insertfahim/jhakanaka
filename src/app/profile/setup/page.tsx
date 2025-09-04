"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AvatarSelector from "@/components/AvatarSelector";

export default function ProfileSetup() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);
    const [formData, setFormData] = useState({
        major: "",
        semester: "",
        cgpa: "",
        enrolledCourses: "",
        skills: "",
        interests: "",
        showCgpa: false,
        avatar: "",
    });

    const checkExistingProfile = useCallback(async () => {
        try {
            const response = await fetch("/api/profile");
            if (response.ok) {
                const profileData = await response.json();
                // If user has basic profile info, redirect to dashboard
                if (profileData.major || profileData.semester) {
                    router.push("/dashboard");
                    return;
                }
            }
        } catch (error) {
            console.error("Error checking profile:", error);
        } finally {
            setCheckingProfile(false);
        }
    }, [router]);

    useEffect(() => {
        if (status === "authenticated") {
            checkExistingProfile();
        }
    }, [status, checkExistingProfile]);

    if (status === "loading" || checkingProfile) {
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
                body: JSON.stringify({
                    major: formData.major,
                    semester: formData.semester,
                    cgpa: formData.cgpa,
                    enrolledCourses: formData.enrolledCourses,
                    skills: formData.skills,
                    interests: formData.interests,
                    showCgpa: formData.showCgpa,
                    avatar: formData.avatar,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            router.push("/dashboard");
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("Failed to update profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        router.push("/dashboard");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
                                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                            />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Complete Your Profile
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Help us personalize your experience with BRACU Notes
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <AvatarSelector
                                currentAvatar={formData.avatar}
                                onAvatarChange={(avatarUrl) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        avatar: avatarUrl,
                                    }))
                                }
                                userName={session?.user?.name}
                            />
                        </div>

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
                                rows={3}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="e.g., CSE110, MAT120, ENG101 (one per line or comma-separated)"
                                value={formData.enrolledCourses}
                                onChange={handleChange}
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                This helps us recommend relevant study groups
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

                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {loading ? "Saving..." : "Complete Profile"}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="flex-1 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Skip for Now
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
