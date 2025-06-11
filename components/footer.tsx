import { Globe, Users } from 'lucide-react'
import React from 'react'

const footer = () => {
  return (
    <div>
         <footer className="bg-gray-900 text-white py-12 w-full mt-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
                BlackRaven
              </h3>
              <p className="text-gray-400 mb-4">
                Secure, time-based file sharing for businesses that value privacy and control.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Users className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition">
                  <Globe className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                {["Features", "Pricing", "Security", "Enterprise"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white transition">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                {["Documentation", "Guides", "API", "Status"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white transition">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                {["About", "Blog", "Careers", "Contact"].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-white transition">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">© {new Date().getFullYear()} BlackRaven. All rights reserved.</p>
            <div className="flex space-x-6">
              <a href="/terms" className="text-gray-400 hover:text-white transition text-sm">
                Terms of Service
              </a>
              <a href="/privacy" className="text-gray-400 hover:text-white transition text-sm">
                Privacy Policy
              </a>
              <a href="/cookies" className="text-gray-400 hover:text-white transition text-sm">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default footer