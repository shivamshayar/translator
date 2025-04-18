import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show navbar on participant interface
  if (location.startsWith('/event/')) {
    return null;
  }

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="flex-shrink-0 flex items-center">
                <span className="text-primary text-2xl font-bold">SpeakEasy</span>
                <span className="ml-1 text-secondary text-2xl font-bold">Translate</span>
              </a>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="hidden sm:flex space-x-4">
              <Link href="/dashboard">
                <a className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location === "/dashboard" 
                    ? "text-primary" 
                    : "text-gray-600 hover:text-primary"
                }`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/create-event">
                <Button variant="default" className="bg-primary text-white hover:bg-blue-600">
                  Create Event
                </Button>
              </Link>
            </div>
            <button 
              className="sm:hidden p-2 rounded-md text-gray-600 hover:text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/dashboard">
              <a className={`block px-3 py-2 rounded-md text-base font-medium ${
                location === "/dashboard" 
                  ? "text-primary bg-primary/10" 
                  : "text-gray-600 hover:text-primary hover:bg-primary/5"
              }`}>
                Dashboard
              </a>
            </Link>
            <Link href="/create-event">
              <a className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-white">
                Create Event
              </a>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
