import { Route, Switch } from "wouter";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import LandingPage from "./pages/LandingPage";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import CreateEventForm from "./pages/CreateEventForm";
import ParticipantInterface from "./pages/ParticipantInterface";
import EventBroadcastPage from "./pages/EventBroadcastPage";
import NotFound from "@/pages/not-found";
import EventQRModal from "./components/EventQRModal";
import { useState } from "react";

function App() {
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<any>(null);

  const showQrModal = (event: any) => {
    setCurrentEvent(event);
    setQrModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/dashboard">
            {() => <OrganizerDashboard onShowQR={showQrModal} />}
          </Route>
          <Route path="/create-event">
            {() => <CreateEventForm onEventCreated={showQrModal} />}
          </Route>
          <Route path="/event/:eventId">
            {(params) => <ParticipantInterface eventId={params.eventId} />}
          </Route>
          <Route path="/broadcast/:eventId">
            {(params) => <EventBroadcastPage eventId={params.eventId} onShowQR={showQrModal} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />

      {qrModalOpen && (
        <EventQRModal 
          event={currentEvent} 
          isOpen={qrModalOpen} 
          onClose={() => setQrModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default App;
