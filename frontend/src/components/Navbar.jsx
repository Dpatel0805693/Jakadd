import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Home, Upload, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/results', label: 'Results', icon: TrendingUp }
  ];

  return (
    <nav className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo - Minimal */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-medium text-slate-200 group-hover:text-slate-100 transition-colors">
              Stats<span className="text-violet-400">Mate</span>
            </span>
          </Link>

          {/* Navigation Links - Minimal Pills */}
          <div className="flex space-x-1">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5 mr-1.5" />
                {label}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </nav>
  );
}