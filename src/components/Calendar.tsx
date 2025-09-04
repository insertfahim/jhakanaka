"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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
    Calendar as CalendarIcon,
    Clock,
    MapPin,
    Users,
    Plus,
    CheckCircle,
    XCircle,
    AlertCircle,
    Video,
} from "lucide-react";

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    location: string | null;
    isVirtual: boolean;
    meetingLink: string | null;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    _count: {
        rsvps: number;
    };
    rsvps: Array<{
        id: string;
        status: "ATTENDING" | "MAYBE" | "NOT_ATTENDING";
        user: {
            id: string;
            name: string | null;
            email: string;
        };
    }>;
    userRsvp?: {
        status: "ATTENDING" | "MAYBE" | "NOT_ATTENDING";
    };
}

interface CalendarProps {
    groupId: string;
    groupName: string;
}

export default function Calendar({ groupId, groupName }: CalendarProps) {
    useSession();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
        null
    );

    // Form states for creating events
    const [eventForm, setEventForm] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        location: "",
        isVirtual: false,
        meetingLink: "",
    });

    const fetchEvents = useCallback(async () => {
        try {
            const startOfMonth = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                1
            );
            const endOfMonth = new Date(
                selectedDate.getFullYear(),
                selectedDate.getMonth() + 1,
                0
            );

            const response = await fetch(
                `/api/groups/${groupId}/calendar?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
            );

            if (response.ok) {
                const data = await response.json();
                setEvents(data);
            }
        } catch (error) {
            console.error("Error fetching events:", error);
        } finally {
            setIsLoading(false);
        }
    }, [groupId, selectedDate]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCreateEvent = async () => {
        try {
            const response = await fetch(`/api/groups/${groupId}/calendar`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(eventForm),
            });

            if (response.ok) {
                const newEvent = await response.json();
                setEvents((prev) => [...prev, newEvent]);
                setShowCreateDialog(false);
                setEventForm({
                    title: "",
                    description: "",
                    startTime: "",
                    endTime: "",
                    location: "",
                    isVirtual: false,
                    meetingLink: "",
                });
            }
        } catch (error) {
            console.error("Error creating event:", error);
        }
    };

    const handleRsvp = async (
        eventId: string,
        status: "ATTENDING" | "MAYBE" | "NOT_ATTENDING"
    ) => {
        try {
            // Map frontend status to backend status
            const backendStatus =
                status === "ATTENDING"
                    ? "GOING"
                    : status === "NOT_ATTENDING"
                    ? "NOT_GOING"
                    : status;

            const response = await fetch(
                `/api/groups/${groupId}/calendar/${eventId}/rsvp`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ status: backendStatus }),
                }
            );

            if (response.ok) {
                // Refresh events to get updated RSVP counts
                fetchEvents();
            }
        } catch (error) {
            console.error("Error updating RSVP:", error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const getRsvpStatusColor = (status: string) => {
        switch (status) {
            case "ATTENDING":
                return "bg-green-100 text-green-800";
            case "MAYBE":
                return "bg-yellow-100 text-yellow-800";
            case "NOT_ATTENDING":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    };

    const getEventsForDate = (date: Date) => {
        return events.filter((event) => {
            const eventDate = new Date(event.startTime);
            return eventDate.toDateString() === date.toDateString();
        });
    };

    const days = getDaysInMonth(selectedDate);
    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

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
                        {monthNames[selectedDate.getMonth()]}{" "}
                        {selectedDate.getFullYear()}
                    </h2>
                    <p className="text-gray-600">{groupName} - Calendar</p>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Button
                            variant={
                                viewMode === "month" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setViewMode("month")}
                        >
                            Month
                        </Button>
                        <Button
                            variant={
                                viewMode === "week" ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setViewMode("week")}
                        >
                            Week
                        </Button>
                        <Button
                            variant={viewMode === "day" ? "default" : "outline"}
                            size="sm"
                            onClick={() => setViewMode("day")}
                        >
                            Day
                        </Button>
                    </div>

                    <Dialog
                        open={showCreateDialog}
                        onOpenChange={setShowCreateDialog}
                    >
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Create New Event</DialogTitle>
                                <DialogDescription>
                                    Schedule a new event for your study group.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={eventForm.title}
                                        onChange={(e) =>
                                            setEventForm((prev) => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
                                        placeholder="Event title"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={eventForm.description}
                                        onChange={(e) =>
                                            setEventForm((prev) => ({
                                                ...prev,
                                                description: e.target.value,
                                            }))
                                        }
                                        placeholder="Event description"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="startTime">
                                            Start Time
                                        </Label>
                                        <Input
                                            id="startTime"
                                            type="datetime-local"
                                            value={eventForm.startTime}
                                            onChange={(e) =>
                                                setEventForm((prev) => ({
                                                    ...prev,
                                                    startTime: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="endTime">
                                            End Time
                                        </Label>
                                        <Input
                                            id="endTime"
                                            type="datetime-local"
                                            value={eventForm.endTime}
                                            onChange={(e) =>
                                                setEventForm((prev) => ({
                                                    ...prev,
                                                    endTime: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="location">Location</Label>
                                    <Input
                                        id="location"
                                        value={eventForm.location}
                                        onChange={(e) =>
                                            setEventForm((prev) => ({
                                                ...prev,
                                                location: e.target.value,
                                            }))
                                        }
                                        placeholder="Physical location or 'Online'"
                                    />
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="isVirtual"
                                        checked={eventForm.isVirtual}
                                        onChange={(e) =>
                                            setEventForm((prev) => ({
                                                ...prev,
                                                isVirtual: e.target.checked,
                                            }))
                                        }
                                        className="rounded"
                                    />
                                    <Label htmlFor="isVirtual">
                                        Virtual Event
                                    </Label>
                                </div>

                                {eventForm.isVirtual && (
                                    <div>
                                        <Label htmlFor="meetingLink">
                                            Meeting Link
                                        </Label>
                                        <Input
                                            id="meetingLink"
                                            value={eventForm.meetingLink}
                                            onChange={(e) =>
                                                setEventForm((prev) => ({
                                                    ...prev,
                                                    meetingLink: e.target.value,
                                                }))
                                            }
                                            placeholder="Zoom, Google Meet, etc."
                                        />
                                    </div>
                                )}

                                <div className="flex justify-end space-x-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setShowCreateDialog(false)
                                        }
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateEvent}
                                        disabled={
                                            !eventForm.title ||
                                            !eventForm.startTime ||
                                            !eventForm.endTime
                                        }
                                    >
                                        Create Event
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day) => (
                            <div
                                key={day}
                                className="p-4 text-center font-medium text-gray-900"
                            >
                                {day}
                            </div>
                        )
                    )}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                    {days.map((date, index) => {
                        const dayEvents = date ? getEventsForDate(date) : [];
                        const isToday =
                            date &&
                            date.toDateString() === new Date().toDateString();
                        const isCurrentMonth =
                            date && date.getMonth() === selectedDate.getMonth();

                        return (
                            <div
                                key={index}
                                className={`min-h-[120px] p-2 border-r border-b border-gray-200 ${
                                    isToday ? "bg-blue-50" : ""
                                } ${!isCurrentMonth ? "bg-gray-50" : ""}`}
                            >
                                {date && (
                                    <>
                                        <div
                                            className={`text-sm font-medium mb-1 ${
                                                isToday
                                                    ? "text-blue-600"
                                                    : isCurrentMonth
                                                    ? "text-gray-900"
                                                    : "text-gray-400"
                                            }`}
                                        >
                                            {date.getDate()}
                                        </div>

                                        <div className="space-y-1">
                                            {dayEvents
                                                .slice(0, 3)
                                                .map((event) => (
                                                    <div
                                                        key={event.id}
                                                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded cursor-pointer hover:bg-blue-200"
                                                        onClick={() =>
                                                            setSelectedEvent(
                                                                event
                                                            )
                                                        }
                                                    >
                                                        <div className="font-medium truncate">
                                                            {event.title}
                                                        </div>
                                                        <div className="text-blue-600">
                                                            {formatTime(
                                                                event.startTime
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                            {dayEvents.length > 3 && (
                                                <div className="text-xs text-gray-500">
                                                    +{dayEvents.length - 3} more
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming Events</CardTitle>
                        <CardDescription>Next 7 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {events
                                .filter(
                                    (event) =>
                                        new Date(event.startTime) > new Date()
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(a.startTime).getTime() -
                                        new Date(b.startTime).getTime()
                                )
                                .slice(0, 5)
                                .map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className="flex-shrink-0">
                                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {event.title}
                                            </h4>
                                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {formatTime(
                                                            event.startTime
                                                        )}
                                                    </span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center space-x-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span className="truncate">
                                                            {event.location}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Users className="h-3 w-3 text-gray-400" />
                                                <span className="text-xs text-gray-500">
                                                    {event._count?.rsvps ??
                                                        event.rsvps?.length ??
                                                        0}{" "}
                                                    attending
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {events.filter(
                                (event) =>
                                    new Date(event.startTime) > new Date()
                            ).length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No upcoming events</p>
                                    <p className="text-sm">
                                        Create your first event to get started!
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>My Events</CardTitle>
                        <CardDescription>
                            Events you&apos;re attending
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {events
                                .filter(
                                    (event) =>
                                        event.userRsvp?.status === "ATTENDING"
                                )
                                .sort(
                                    (a, b) =>
                                        new Date(a.startTime).getTime() -
                                        new Date(b.startTime).getTime()
                                )
                                .slice(0, 5)
                                .map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        <div className="flex-shrink-0">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {event.title}
                                            </h4>
                                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                                                <div className="flex items-center space-x-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {formatDate(
                                                            event.startTime
                                                        )}{" "}
                                                        at{" "}
                                                        {formatTime(
                                                            event.startTime
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {events.filter(
                                (event) =>
                                    event.userRsvp?.status === "ATTENDING"
                            ).length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>Not attending any events</p>
                                    <p className="text-sm">
                                        RSVP to events to see them here!
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Event Details Dialog */}
            {selectedEvent && (
                <Dialog
                    open={!!selectedEvent}
                    onOpenChange={() => setSelectedEvent(null)}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                                <CalendarIcon className="h-5 w-5" />
                                <span>{selectedEvent.title}</span>
                            </DialogTitle>
                            <DialogDescription>
                                Created by{" "}
                                {selectedEvent.user.name ||
                                    selectedEvent.user.email}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Event Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            Date & Time
                                        </h4>
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Clock className="h-4 w-4" />
                                            <span>
                                                {formatDate(
                                                    selectedEvent.startTime
                                                )}{" "}
                                                from{" "}
                                                {formatTime(
                                                    selectedEvent.startTime
                                                )}{" "}
                                                to{" "}
                                                {formatTime(
                                                    selectedEvent.endTime
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {selectedEvent.location && (
                                        <div>
                                            <h4 className="font-medium text-gray-900 mb-2">
                                                Location
                                            </h4>
                                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                {selectedEvent.isVirtual ? (
                                                    <Video className="h-4 w-4" />
                                                ) : (
                                                    <MapPin className="h-4 w-4" />
                                                )}
                                                <span>
                                                    {selectedEvent.location}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {selectedEvent.isVirtual &&
                                        selectedEvent.meetingLink && (
                                            <div>
                                                <h4 className="font-medium text-gray-900 mb-2">
                                                    Meeting Link
                                                </h4>
                                                <a
                                                    href={
                                                        selectedEvent.meetingLink
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                                                >
                                                    {selectedEvent.meetingLink}
                                                </a>
                                            </div>
                                        )}
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Attendees (
                                        {selectedEvent._count?.rsvps ??
                                            selectedEvent.rsvps?.length ??
                                            0}
                                        )
                                    </h4>
                                    <div className="space-y-2 max-h-32 overflow-y-auto">
                                        {selectedEvent.rsvps.map((rsvp) => (
                                            <div
                                                key={rsvp.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-xs">
                                                        {rsvp.user.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase() ||
                                                            "U"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-gray-600">
                                                    {rsvp.user.name ||
                                                        rsvp.user.email}
                                                </span>
                                                <Badge
                                                    className={`text-xs ${getRsvpStatusColor(
                                                        rsvp.status
                                                    )}`}
                                                >
                                                    {rsvp.status.toLowerCase()}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {selectedEvent.description && (
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">
                                        Description
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {selectedEvent.description}
                                    </p>
                                </div>
                            )}

                            {/* RSVP Actions */}
                            <div>
                                <h4 className="font-medium text-gray-900 mb-3">
                                    Your Response
                                </h4>
                                <div className="flex space-x-2">
                                    <Button
                                        variant={
                                            selectedEvent.userRsvp?.status ===
                                            "ATTENDING"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            handleRsvp(
                                                selectedEvent.id,
                                                "ATTENDING"
                                            )
                                        }
                                        className="flex items-center space-x-1"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Attending</span>
                                    </Button>
                                    <Button
                                        variant={
                                            selectedEvent.userRsvp?.status ===
                                            "MAYBE"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            handleRsvp(
                                                selectedEvent.id,
                                                "MAYBE"
                                            )
                                        }
                                        className="flex items-center space-x-1"
                                    >
                                        <AlertCircle className="h-4 w-4" />
                                        <span>Maybe</span>
                                    </Button>
                                    <Button
                                        variant={
                                            selectedEvent.userRsvp?.status ===
                                            "NOT_ATTENDING"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            handleRsvp(
                                                selectedEvent.id,
                                                "NOT_ATTENDING"
                                            )
                                        }
                                        className="flex items-center space-x-1"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        <span>Not Attending</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
