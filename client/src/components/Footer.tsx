import { Link } from "wouter";
import { useLocation } from "wouter";

const Footer = () => {
  const [location] = useLocation();
  
  // Don't show footer on participant interface
  if (location.startsWith('/event/')) {
    return null;
  }
  
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Features</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Pricing</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Integrations</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">API</a></Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Resources</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Documentation</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Guides</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Support</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Webinars</a></Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">About</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Blog</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Careers</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Contact</a></Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
            <ul role="list" className="mt-4 space-y-4">
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Privacy</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Terms</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Security</a></Link></li>
              <li><Link href="#"><a className="text-base text-gray-300 hover:text-white">Cookies</a></Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-primary text-xl font-bold">SpeakEasy</span>
            <span className="ml-1 text-secondary text-xl font-bold">Translate</span>
          </div>
          <p className="text-base text-gray-400">&copy; {new Date().getFullYear()} SpeakEasy Translate. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
