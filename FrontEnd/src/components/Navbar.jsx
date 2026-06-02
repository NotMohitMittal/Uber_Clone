import React, { useState, useEffect } from "react";
import { Sun, Moon, User, Menu, X, LayoutTemplate } from "lucide-react";

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle theme class on the document body/html for global effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  const navItems = ["Dashboard", "Projects", "Analytics", "Settings"];

  return (
    <nav className="sticky top-0 z-50 w-full transition-colors duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-purple-100 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / App Title */}
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="p-2 bg-linear-to-br from-blue-500 to-purple-600 rounded-lg text-white group-hover:rotate-12 transition-transform duration-300">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              UBER
            </span>
          </div>

          {/* Desktop Navigation Items */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="relative text-gray-600 dark:text-gray-300 font-medium text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 group"
              >
                {item}
                {/* Animated underline */}
                <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-purple-600 dark:bg-purple-400 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"></span>
              </a>
            ))}
          </div>

          {/* Right Section: Theme Toggle & User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-5 w-5 animate-in spin-in duration-500" />
              ) : (
                <Moon className="h-5 w-5 animate-in spin-in duration-500" />
              )}
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-gray-200 dark:bg-slate-700"></div>

            {/* User Profile */}
            <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors duration-200 group focus:outline-none focus:ring-2 focus:ring-purple-500">
              <div className="h-8 w-8 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
                <User className="h-4 w-4" />
              </div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-full text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-slate-800"
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-slate-900 border-t border-purple-50 dark:border-slate-800 shadow-lg">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
            >
              {item}
            </a>
          ))}
          {/* Mobile Profile Row */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center px-3">
            <div className="h-8 w-8 rounded-full bg-linear-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white">
              <User className="h-4 w-4" />
            </div>
            <span className="ml-3 text-base font-medium text-gray-700 dark:text-gray-300">
              My Profile
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
