import {
  BarChart3,
  DollarSign,
  FileText,
  Home,
  Package,
  Settings, Shield,
  TrendingUp,
  UserPlus,
  Users,
  Wallet
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { isAdmin, getCurrentUser } from '../../utils/auth';
import { getUserNotifications } from '../../utils/database';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [adminMode, setAdminMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const adminCheck = await isAdmin();
        setAdminMode(adminCheck);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setAdminMode(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user?.id) return;
      const notif = await getUserNotifications(user.id);
      setNotifications(notif);
    };
    fetchNotifications();
  }, []);

  const userNavItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/referrals', icon: Users, label: 'My Team' },
    { to: '/packages', icon: Package, label: 'Packages' },
    { to: '/wallet', icon: Wallet, label: 'Wallet' },
    { to: '/income', icon: TrendingUp, label: 'Income' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/profile', icon: Settings, label: 'Profile' },
  ];

  const adminNavItems = [
    { to: '/admin', icon: Shield, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/packages', icon: Package, label: 'Packages' },
    { to: '/admin/transactions', icon: DollarSign, label: 'Transactions' },
    { to: '/admin/income', icon: TrendingUp, label: 'Income Management' },
    { to: '/admin/referrals', icon: UserPlus, label: 'Referrals' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:relative lg:z-auto">
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-blue-900">Loading...</h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const navItems = adminMode ? adminNavItems : userNavItems;
  const currentUser = getCurrentUser();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:z-auto
      `}>
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-xl font-bold text-blue-900">
                {adminMode ? 'Admin Panel' : 'GrowwPark'}
              </h1>
            </div>
            <nav className="mt-8 flex-1 px-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive
                        ? 'bg-blue-100 text-blue-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                  onClick={onClose}
                >
                  <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
          {/* Notifications Section - remove this block entirely */}
          {/* ... existing user info ... */}
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex-shrink-0 w-full group block">
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    {adminMode ? 'Admin Mode' : 'User Mode'}
                  </p>
                  <p className="text-xs font-medium text-gray-500 group-hover:text-gray-700">
                    {currentUser?.email || 'Not logged in'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;