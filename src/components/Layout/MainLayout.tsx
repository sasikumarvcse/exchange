import { Menu } from 'lucide-react';
import React, { useState } from 'react';
import ErrorBoundary from './ErrorBoundary'; // If the file is ErrorBoundary.tsx
import Header from './Header';
import Sidebar from './Sidebar';
import { getUserNotifications } from '../../utils/database';

interface MainLayoutProps {
  title: string;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ title, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchNotifications = async () => {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return;
      const user = JSON.parse(userStr);
      if (!user?.id) return;
      const notif = await getUserNotifications(user.id);
      setNotifications(notif);
    };
    fetchNotifications();
    // Optionally, poll or use realtime for updates
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white border-b">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button> 
          <h1 className="text-xl font-bold text-blue-900">GrowwPark</h1>
        </div>
        
        <ErrorBoundary>
          <Header title={title} notifications={notifications} />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default MainLayout;