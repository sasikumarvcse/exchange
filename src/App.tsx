import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { User } from './types';
import { verifySession } from './utils/auth';
import ProtectedRoute from './components/common/ProtectedRoute';

// Landing Page
import Landing from './pages/Landing';

// Auth Pages
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Layout
import MainLayout from './components/Layout/MainLayout';

// User Pages
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Packages from './pages/Packages';
import Profile from './pages/Profile';
import Referrals from './pages/Referrals';
import Reports from './pages/Reports';
import Wallet from './pages/Wallet';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminIncome from './pages/Admin/AdminIncome';
import AdminPackages from './pages/Admin/AdminPackages';
import AdminReferrals from './pages/Admin/AdminReferrals';
import AdminReports from './pages/Admin/AdminReports';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminTransactions from './pages/Admin/AdminTransactions';
import AdminUsers from './pages/Admin/AdminUsers';

// Route Guards
const AuthProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<'loading'|'authenticated'|'unauthenticated'>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await verifySession();
        setUser(currentUser);
        setAuthState(currentUser ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        console.error('Auth check error:', error);
        setAuthState('unauthenticated');
      }
    };
    
    checkAuth();
  }, []);

  if (authState === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return authState === 'authenticated' ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <AuthProtectedRoute>
                <MainLayout title="Dashboard">
                  <Dashboard />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/referrals"
            element={
              <AuthProtectedRoute>
                <MainLayout title="My Team">
                  <Referrals />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/packages"
            element={
              <AuthProtectedRoute>
                <MainLayout title="Packages">
                  <Packages />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <AuthProtectedRoute>
                <MainLayout title="Wallet">
                  <Wallet />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/income"
            element={
              <AuthProtectedRoute>
                <MainLayout title="Income">
                  <Income />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <AuthProtectedRoute>
                <MainLayout title="Reports">
                  <Reports />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthProtectedRoute>
                <MainLayout title="Profile">
                  <Profile />
                </MainLayout>
              </AuthProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="Admin Dashboard">
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="User Management">
                  <AdminUsers />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/packages"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="Package Management">
                  <AdminPackages />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="Transaction Management">
                  <AdminTransactions />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/income"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="Income Management">
                  <AdminIncome />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/referrals"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="Referral Management">
                  <AdminReferrals />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="Reports & Analytics">
                  <AdminReports />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute requireAdmin={true}>
                <MainLayout title="System Settings">
                  <AdminSettings />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;