import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "react-qr-code";
import { Download, Share2, Radio, Mic } from "lucide-react";
import { useLocation } from "wouter";

interface EventQRModalProps {
  event: any;
  isOpen: boolean;
  onClose: () => void;
}

const EventQRModal = ({ event, isOpen, onClose }: EventQRModalProps) => {
  const [eventUrl, setEventUrl] = useState<string>("");
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (event && event.id) {
      // Create the event URL for participants
      const baseUrl = window.location.origin;
      setEventUrl(`${baseUrl}/event/${event.id}`);
    }
  }, [event]);

  const handleDownload = () => {
    // Create a canvas from the QR code
    const canvas = document.querySelector("canvas");
    if (!canvas) return;
    
    const link = document.createElement("a");
    link.download = `${event.name.replace(/\s+/g, '_')}_QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code for ${event.name}`,
          text: "Scan this QR code to access real-time translations for the event.",
          url: eventUrl
        });
      } catch (error) {
        console.log("Sharing failed", error);
      }
    } else {
      // Fallback to copying the link to clipboard
      navigator.clipboard.writeText(eventUrl);
      alert("Event link copied to clipboard!");
    }
  };

  const goToBroadcastPage = () => {
    if (event && event.id) {
      setLocation(`/broadcast/${event.id}`);
      onClose();
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Event QR Code</DialogTitle>
          <DialogDescription className="text-center">
            Share this QR code with your event participants. They can scan it to access real-time translations.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center">
          <div className="w-64 h-64 bg-white p-4 border border-gray-200 rounded-lg flex items-center justify-center mb-4">
            {eventUrl && (
              <QRCode
                size={256}
                value={eventUrl}
                fgColor="#000000"
                bgColor="#FFFFFF"
                level="L"
              />
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">{event.name}</p>
          <p className="text-xs text-gray-500 mb-4">{event.date} • {event.location}</p>
          
          <div className="flex space-x-4">
            <Button
              variant="default" 
              onClick={handleDownload}
              className="bg-primary hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="h-5 w-5" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share2 className="h-5 w-5" />
              Share
            </Button>
          </div>
        </div>

        <div className="mt-2 px-4">
          <p className="text-xs text-gray-500 text-center">
            Participants can directly access this URL: <br />
            <a href={eventUrl} className="text-primary underline break-all" target="_blank" rel="noopener noreferrer">
              {eventUrl}
            </a>
          </p>
        </div>

        <div className="mt-4 border-t pt-4">
          <Button 
            variant="default"
            onClick={goToBroadcastPage}
            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2 text-white"
          >
            <Radio className="h-5 w-5" />
            Go to Broadcasting Page
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Begin broadcasting to start real-time translation
          </p>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventQRModal;
