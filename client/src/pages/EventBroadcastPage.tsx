import { useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Users, PanelRight, Link as LinkIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import AudioBroadcaster from '@/components/AudioBroadcaster';

interface EventBroadcastPageProps {
  eventId: string;
  onShowQR?: (event: Event) => void;
}

interface Event {
  id: number;
  name: string;
  date: string;
  time?: string;
  location: string;
  description?: string;
  eventType?: string;
  supportedLanguages?: string[];
  audioConfig?: string;
  enableAudioTranslation?: boolean;
  organizerId: number;
  createdAt: string;
}

const EventBroadcastPage = ({ eventId, onShowQR }: EventBroadcastPageProps) => {
  const [, setLocation] = useLocation();
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Query for event details
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    enabled: Boolean(eventId),
  });

  // Reset copy success message after 2 seconds
  useEffect(() => {
    if (copySuccess) {
      const timer = setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [copySuccess]);

  // Generate participant URL
  const getParticipantUrl = () => {
    return `${window.location.origin}/event/${eventId}`;
  };

  // Copy participant URL to clipboard
  const copyParticipantUrl = () => {
    navigator.clipboard.writeText(getParticipantUrl())
      .then(() => setCopySuccess(true))
      .catch(err => console.error('Failed to copy: ', err));
  };

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-700">Error loading event: {(error as Error).message}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={handleBackToDashboard}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="pl-0 text-gray-600"
          onClick={handleBackToDashboard}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              {isLoading ? <Skeleton className="h-8 w-48" /> : event?.name}
            </h1>
            <p className="text-gray-500 mt-1">
              {isLoading ? <Skeleton className="h-4 w-32" /> : (
                <>
                  {event?.date} • {event?.location}
                </>
              )}
            </p>
          </div>

          {/* Audio Broadcaster */}
          {!isLoading && event && (
            <AudioBroadcaster eventId={parseInt(eventId)} />
          )}

          {/* Event Details */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Event Details</h2>
              
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-3/4" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Event Type</p>
                      <p className="mt-1">{event?.eventType || 'Conference'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date & Time</p>
                      <p className="mt-1">{event?.date} {event?.time && `at ${event.time}`}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="mt-1">{event?.location}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Supported Languages</p>
                      <p className="mt-1">
                        {event?.supportedLanguages?.length 
                          ? event.supportedLanguages.join(', ') 
                          : 'English (default)'}
                      </p>
                    </div>
                  </div>

                  {event?.description && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500">Description</p>
                      <p className="mt-1">{event.description}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-80">
          {/* Participant Access */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Users className="h-5 w-5 text-primary mr-2" />
                <h2 className="text-lg font-medium">Participant Access</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Participant Link</p>
                  <div className="flex">
                    <div className="flex-1 bg-gray-50 p-2 text-sm rounded-l-md truncate border border-r-0 border-gray-200">
                      {getParticipantUrl()}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-l-none"
                      onClick={copyParticipantUrl}
                    >
                      {copySuccess ? 'Copied!' : (
                        <>
                          <LinkIcon className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-500 mb-2">QR Code</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => event && onShowQR && onShowQR(event)}
                  >
                    <PanelRight className="h-4 w-4 mr-1" />
                    View QR Code
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Audio Settings */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Audio Settings</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Audio Configuration</p>
                  <p className="mt-1 text-sm">
                    {event?.audioConfig || 'Direct connection to venue audio system'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Audio Translation</p>
                  <p className="mt-1 text-sm">
                    {event?.enableAudioTranslation 
                      ? 'Enabled - Participants can listen to translations' 
                      : 'Disabled - Text-only translations'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventBroadcastPage;