/**
 * 🔥 Main Layout Component
 * 
 * Root layout with navigation, header, and responsive design
 */

import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  FireIcon, 
  HomeIcon, 
  UsersIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const MainLayout: React.FC = () => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Firefighters', href: '/firefighters', icon: UsersIcon },
    { name: 'Monitoring', href: '/monitoring', icon: ChartBarIcon },
    { name: 'Alerts', href: '/alerts', icon: ExclamationTriangleIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ];

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-emergency-600">
          <FireIcon className="w-8 h-8 text-white mr-2" />
          <h1 className="text-xl font-bold text-white">FireWatch</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = isActivePath(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-emergency-50 text-emergency-700 border-r-4 border-emergency-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                      isActive ? 'text-emergency-600' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* System Status */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>System Status</span>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
            <div className="text-xs text-gray-600">
              <div>Active Firefighters: 12</div>
              <div>Active Alerts: 3</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {navigation.find(item => isActivePath(item.href))?.name || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Real-time firefighter monitoring and safety management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  Last Updated: {new Date().toLocaleTimeString()}
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">AD</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          <div className="px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
