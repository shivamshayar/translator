import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const LandingPage = () => {
  const [, setLocation] = useLocation();

  const handleCreateEvent = () => {
    setLocation("/create-event");
  };

  const handleGetStarted = () => {
    setLocation("/dashboard");
  };

  return (
    <div id="landing-page" className="pb-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent py-16 md:py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Real-time Audio Translation for Events</h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-3xl mx-auto">
            Enhance accessibility and engagement at your events with instant, accurate translations in multiple languages.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
            <Button
              onClick={handleCreateEvent}
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg shadow-lg transition h-auto"
            >
              Create an Event
            </Button>
            <Button
              variant="outline"
              className="bg-white/20 text-white hover:bg-white/30 font-semibold px-6 py-3 rounded-lg shadow transition h-auto border-white"
            >
              How It Works
            </Button>
          </div>
          <div className="relative mt-10 mx-auto max-w-4xl">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1540317580384-e5d43867caa6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
                alt="Conference with translation service in use"
                className="w-full h-64 md:h-96 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Event Creation & QR Code</h3>
              <p className="text-gray-600">Organizers create events on our platform and receive a unique QR code for participants.</p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Participant QR Scan</h3>
              <p className="text-gray-600">Attendees scan the QR code with their smartphone to access the translation interface.</p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-Time Translation</h3>
              <p className="text-gray-600">AI-powered transcription and translation in the participant's preferred language.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Multi-language Support</h3>
                <p className="text-gray-600">Support for all global languages, ensuring broad accessibility for international events.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Browser-Based</h3>
                <p className="text-gray-600">No app download required. Works instantly on any device with a web browser.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Audio Translation</h3>
                <p className="text-gray-600">Option to receive translations as text or listen to audio translations in real-time.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Processing</h3>
                <p className="text-gray-600">Sentence-by-sentence translation for improved readability and synchronization with the speaker.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-accent text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to enhance your next event?</h2>
          <p className="text-lg mb-8 text-white/90">Create your first event now and experience the power of real-time audio translation.</p>
          <Button 
            onClick={handleGetStarted}
            className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3 rounded-lg shadow-lg transition h-auto"
          >
            Get Started
          </Button>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
