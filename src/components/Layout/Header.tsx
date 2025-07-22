import { Bell, LogOut, Settings, User as UserIcon, Wallet } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, isAdmin, logout } from '../../utils/auth';
import type { User } from '../../types';
import { getUserNotifications } from '../../utils/database';

interface HeaderProps {
  title: string;
  showUserMenu?: boolean;
  notifications?: Array<{ id: string; message: string; read: boolean; date: string }>;
  onNotificationsOpen?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showUserMenu = true, notifications = [], onNotificationsOpen }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  // Remove local notifications state and fetching logic

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  // Remove local notifications state and fetching logic

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAdminToggle = () => {
    navigate(isAdmin() ? '/admin' : '/dashboard');
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse bg-gray-200 h-6 w-32 rounded-md"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-24 rounded-md"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!user && showUserMenu) {
    return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-blue-900">GrowwPark</h1>
            <button 
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Login
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="hidden lg:flex lg:items-center lg:space-x-6">
              <h1 className="text-xl font-bold text-blue-900">GrowwPark</h1>
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            </div>
            <div className="lg:hidden">
              <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            </div>
          </div>

          {user && showUserMenu && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user.wallet_balance?.toFixed(2) ?? '0.00'} GPK
                </span>
              </div>
              
              <div className="relative" ref={notifRef}>
                <button
                  className="relative p-2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    setIsNotifOpen((prev) => !prev);
                    if (!isNotifOpen && onNotificationsOpen) onNotificationsOpen();
                  }}
                  aria-label="View notifications"
                >
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                    {notifications.filter(n => !n.read).length}
                </span>
              </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
                    <div className="p-2 font-bold border-b">Notifications</div>
                    <ul>
                      {notifications.length === 0 ? (
                        <li className="p-2 text-sm text-gray-500">No notifications</li>
                      ) : (
                        notifications.slice().reverse().map((n) => (
                          <li key={n.id} className={`p-2 hover:bg-gray-100 text-sm border-b last:border-b-0 ${!n.read ? 'font-bold' : ''}`}>
                            {n.message}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                  <span className="hidden sm:inline text-sm font-medium">{user.name}</span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.gpk_id}</div>
                    </div>
                    <button 
                      onClick={() => navigate('/profile')}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </button>
                    {/* Remove Admin Panel button for users */}
                    <button 
                      onClick={handleLogout}
                      className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;