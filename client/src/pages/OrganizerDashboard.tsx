import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface OrganizerDashboardProps {
  onShowQR: (event: any) => void;
}

const OrganizerDashboard = ({ onShowQR }: OrganizerDashboardProps) => {
  const [, setLocation] = useLocation();
  const organizerId = 1; // Mock organizer ID for demo
  
  const { data: events = [], isLoading, error } = useQuery<any[]>({
    queryKey: [`/api/events?organizerId=${organizerId}`],
  });

  const mockStats = {
    totalEvents: Array.isArray(events) ? events.length : 0,
    activeEvents: Array.isArray(events) ? events.filter((e: any) => new Date(e.date) >= new Date()).length : 0,
    totalParticipants: 127,
    translationsDelivered: 1284
  };

  const handleCreateEvent = () => {
    setLocation("/create-event");
  };

  const handleViewQR = (event: any) => {
    onShowQR(event);
  };
  
  const handleBroadcast = (eventId: number) => {
    setLocation(`/broadcast/${eventId}`);
  };

  const getStatusBadge = (date: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    
    if (eventDate < today) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Completed</Badge>;
    } else if (eventDate.toDateString() === today.toDateString()) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Active</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Upcoming</Badge>;
    }
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Error loading dashboard: {(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Organizer Dashboard</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 truncate">Total Events</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="mt-1 text-3xl font-semibold text-gray-900">{mockStats.totalEvents}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 truncate">Active Events</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="mt-1 text-3xl font-semibold text-gray-900">{mockStats.activeEvents}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 truncate">Total Participants</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="mt-1 text-3xl font-semibold text-gray-900">{mockStats.totalParticipants}</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-gray-500 truncate">Translations Delivered</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="mt-1 text-3xl font-semibold text-gray-900">{mockStats.translationsDelivered.toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <Button
            className="bg-primary hover:bg-blue-600 text-white flex items-center gap-2"
            onClick={handleCreateEvent}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Create New Event
          </Button>
          
          <Button variant="outline" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            View Analytics
          </Button>
        </div>

        {/* Events Table */}
        <Card className="mb-8">
          <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Your Events</h2>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search events..." 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24 mt-1" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-32 mt-1" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-24" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Skeleton className="h-5 w-8" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Skeleton className="h-5 w-24 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : Array.isArray(events) && events.length > 0 ? (
                  events.map((event: any) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{event.name}</div>
                        <div className="text-sm text-gray-500">{event.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.date}</div>
                        <div className="text-sm text-gray-500">{event.time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(event.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{event.location}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.supportedLanguages?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleBroadcast(event.id)} 
                          className="bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded mx-2"
                        >
                          Go Live
                        </button>
                        <button 
                          onClick={() => handleViewQR(event)} 
                          className="text-primary hover:text-blue-700 mx-2"
                        >
                          View QR
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 mx-2">Manage</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No events found. Create your first event to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
