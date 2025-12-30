import { useState, useEffect } from "react";
import { Calendar, MapPin, Users, Clock, Search, Loader2, CalendarDays, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { eventService } from "@/services/ApiServices";
import { userService } from "@/services/ApiServices";

interface Event {
    _id: string;
    title: string;
    description: string;
    date: string;
    time?: string;
    location?: string;
    type?: string;
    category?: string;
    participants: any[]; // Changed from string[] to any[] to handle both objects and strings
    maxAttendees?: number;
    image?: string;
    isactive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function Events() {
    const [searchQuery, setSearchQuery] = useState("");
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joiningEvent, setJoiningEvent] = useState<string | null>(null);
    const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await eventService.getEvents();

            if (response.success) {
                // Filter only active events
                const activeEvents = response.data.filter(
                    (event: Event) => event.isactive
                );
                setEvents(activeEvents);
                
                // Get current user to check registered events
                await checkRegisteredEvents(activeEvents);
            } else {
                setError(response.message || "Failed to fetch events");
                toast.error("Failed to fetch events");
            }
        } catch (error: any) {
            console.error("Error fetching events:", error);
            setError(error.message || "Failed to fetch events");
            toast.error("Failed to fetch events");
        } finally {
            setLoading(false);
        }
    };

    const checkRegisteredEvents = async (events: Event[]) => {
        try {
            const userResponse = await userService.getCurrentUser();
            
            if (userResponse.success && userResponse.data) {
                const userId = userResponse.data._id;
                console.log("Current User ID:", userId);
                
                const registered = new Set<string>();
                events.forEach(event => {
                    console.log(`Event ${event.title} participants:`, event.participants);
                    // Check if participants array contains objects or strings
                    const isRegistered = event.participants.some((participant: any) => {
                        // Handle both object format {_id: "..."} and string format
                        const participantId = typeof participant === 'string' 
                            ? participant 
                            : participant._id || participant.userId || participant.user;
                        return participantId === userId;
                    });
                    
                    if (isRegistered) {
                        registered.add(event._id);
                    }
                });
                
                console.log("Registered Events:", Array.from(registered));
                setRegisteredEvents(registered);
            }
        } catch (error) {
            console.error("Error checking registered events:", error);
        }
    };

    // Optional: Add a helper function to get userId once to avoid repetition
    const getCurrentUserId = async (): Promise<string | undefined> => {
        try {
            const userResponse = await userService.getCurrentUser();
            return userResponse.data?._id;
        } catch (error) {
            console.error("Error getting current user:", error);
            return undefined;
        }
    };

    const handleJoinEvent = async (eventId: string) => {
        try {
            setJoiningEvent(eventId);
            
            const userId = await getCurrentUserId();
            if (!userId) {
                toast.error("Please login to join events");
                return;
            }
            
            const response = await eventService.joinEvent(eventId);

            if (response.success) {
                // Enhanced success toast with green styling
                toast.success("Successfully joined the event!", {
                    style: {
                        background: '#10b981',
                        color: '#ffffff',
                        border: '1px solid #059669',
                    },
                    duration: 4000,
                    description: "You will receive event updates via email.",
                });
                
                setRegisteredEvents(prev => new Set(prev).add(eventId));
                
                // Update the event's participants count locally
                setEvents(prevEvents => 
                    prevEvents.map(event => 
                        event._id === eventId 
                            ? { ...event, participants: [...event.participants, userId] }
                            : event
                    )
                );
            } else {
                toast.error(response.message || "Failed to join event");
            }
        } catch (error: any) {
            console.error("Error joining event:", error);
            toast.error(error.message || "Failed to join event");
        } finally {
            setJoiningEvent(null);
        }
    };

    const handleLeaveEvent = async (eventId: string) => {
        try {
            setJoiningEvent(eventId);
            
            const userId = await getCurrentUserId();
            if (!userId) {
                toast.error("Unable to leave event");
                return;
            }
            
            const response = await eventService.leaveEvent(eventId);

            if (response.success) {
                toast.success("Successfully left the event", {
                    duration: 3000,
                });
                
                setRegisteredEvents(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(eventId);
                    return newSet;
                });
                
                // Update the event's participants count locally
                setEvents(prevEvents => 
                    prevEvents.map(event => 
                        event._id === eventId 
                            ? { 
                                ...event, 
                                participants: event.participants.filter(p => p !== userId)
                              }
                            : event
                    )
                );
            } else {
                toast.error(response.message || "Failed to leave event");
            }
        } catch (error: any) {
            console.error("Error leaving event:", error);
            toast.error(error.message || "Failed to leave event");
        } finally {
            setJoiningEvent(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const getStatusBadge = (isActive: boolean) => {
        if (isActive) {
            return <Badge className="bg-success/10 text-success border-success/20">Active</Badge>;
        } else {
            return <Badge variant="outline" className="border-warning text-warning">Inactive</Badge>;
        }
    };

    const filteredEvents = events.filter((event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.category && event.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="space-y-6 animate-fade-in">
                {/* Header Skeleton */}
                <div>
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>

                {/* Search Skeleton */}
                <Skeleton className="h-10 max-w-md" />

                {/* Events Count Skeleton */}
                <Skeleton className="h-7 w-56" />

                {/* Events Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-96 rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                        Events
                    </h1>
                    <p className="text-muted-foreground">
                        Discover upcoming events and connect with fellow alumni
                    </p>
                </div>
                <div className="text-center py-12">
                    <Card className="border-destructive/50 bg-destructive/10">
                        <CardContent className="pt-6">
                            <p className="text-destructive mb-4">{error}</p>
                            <Button onClick={fetchEvents} variant="outline" size="sm">
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">
                    Alumni Events
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                    Discover upcoming events and connect with fellow alumni
                </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Events Count */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Upcoming Events ({filteredEvents.length})
                </h2>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
                <div className="text-center py-12">
                    <Card className="border-card-border/50">
                        <CardContent className="pt-12 pb-12">
                            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? "No events found matching your search."
                                    : "No active events available."}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map((event, index) => (
                        <Card 
                            key={event._id} 
                            className="bento-card hover:shadow-md border-card-border/50 animate-fade-in hover-lift group flex flex-col h-full"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                                    {event.title}
                                </CardTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {getStatusBadge(event.isactive)}
                                    {event.category && (
                                        <Badge variant="secondary" className="text-xs">
                                            {event.category}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="flex-1 flex flex-col">
                                <p className="text-muted-foreground text-sm line-clamp-2 min-h-[2.5rem] mb-4">
                                    {event.description}
                                </p>
                                
                                <div className="space-y-2 text-sm flex-1">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="truncate">{formatDate(event.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="truncate">{event.time || "TBD"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="truncate">{event.location || "TBD"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Users className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="truncate">
                                            {event.participants.length} 
                                            {event.maxAttendees && `/${event.maxAttendees}`} participants
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons - Always at bottom */}
                                <div className="flex flex-col gap-2 pt-4 mt-auto">
                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={() => registeredEvents.has(event._id) 
                                            ? handleLeaveEvent(event._id) 
                                            : handleJoinEvent(event._id)
                                        }
                                        disabled={
                                            joiningEvent === event._id ||
                                            (!registeredEvents.has(event._id) && event.maxAttendees && event.participants.length >= event.maxAttendees)
                                        }
                                        variant={registeredEvents.has(event._id) ? "secondary" : "default"}
                                    >
                                        {joiningEvent === event._id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                {registeredEvents.has(event._id) ? "Leaving..." : "Joining..."}
                                            </>
                                        ) : registeredEvents.has(event._id) ? (
                                            <>
                                                <Check className="w-4 h-4 mr-2" />
                                                Leave Event
                                            </>
                                        ) : (event.maxAttendees && event.participants.length >= event.maxAttendees) ? (
                                            "Event Full"
                                        ) : (
                                            "Join Event"
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Load More */}
            {filteredEvents.length > 9 && (
                <div className="text-center pt-6">
                    <Button variant="outline" size="lg" className="border-card-border/50">
                        Load More Events
                    </Button>
                </div>
            )}
        </div>
    );
}