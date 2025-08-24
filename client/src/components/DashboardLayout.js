import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  FileText,
  Menu, 
  X, 
  LogOut,
  Bell,
  User
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
    },
    {
      name: 'Quotes',
      href: '/quotes',
      icon: FileText,
    },
    {
      name: 'Affiliate',
      href: '/affiliate',
      icon: Users,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}>
        
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-sm">SYN</span>
            </div>
            <span className="ml-2 text-white font-semibold text-sm">Syntax Dropshipping</span>
          </div>
          <button
            className="lg:hidden text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* User info at bottom */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-medium">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:pl-0">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white shadow flex-shrink-0">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex flex-1">
              {/* You can add search bar here if needed */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification button */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Bell className="w-6 h-6" />
              </button>
              
              {/* User name display */}
              <div className="ml-3 hidden md:block">
                <span className="text-sm font-medium text-gray-700">
                  Hello, {user?.name || 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;