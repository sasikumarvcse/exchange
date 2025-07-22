import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Package, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import StatsCard from '../../components/Dashboard/StatsCard';
import { getAllUsers, getAllTransactions, getAllIncomes } from '../../utils/database';
import { DashboardStats } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const playNotificationSound = () => {
  const audio = new Audio('/notification.mp3');
  audio.play();
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    pendingVerifications: 0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true); // Set initial loading to true

  // Remove hardcoded recentActivities
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    let initialLoad = true;
    loadDashboardStats(true);
    loadRecentActivities(true);
    const interval = setInterval(() => {
      loadDashboardStats(false);
      loadRecentActivities(false);
    }, 10000); // Poll every 10 seconds

    // --- Realtime subscription for pending deposit notifications ---
    const channel = supabase.channel('admin-pending-deposit-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: 'status=eq.pending&type=eq.deposit'
        },
        async (payload) => {
          // Optionally fetch user name
          let userName = payload.new.user_id;
          try {
            const { data: user } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', payload.new.user_id)
              .single();
            if (user?.name) userName = user.name;
            else if (user?.email) userName = user.email;
          } catch {}
          playNotificationSound();
          toast(
            <span>
              <b>New deposit request:</b> {userName} - {payload.new.amount} GPK<br />
              <small>Reference: {payload.new.reference_id}</small><br />
              <a
                href={`/admin/transactions?highlight=${payload.new.id}`}
                style={{ color: '#2563eb', textDecoration: 'underline' }}
                onClick={() => toast.dismiss()}
              >
                View Transaction
              </a>
            </span>,
            { duration: Infinity }
          );
          loadDashboardStats(false); // Refresh data silently
          loadRecentActivities(false); // Refresh data silently
        }
      );
    channel.subscribe();
    return () => {
      clearInterval(interval);
      channel.unsubscribe();
    };
  }, []);

  const loadDashboardStats = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const users = await getAllUsers();
      const transactions = await getAllTransactions();
      const incomes = await getAllIncomes();

      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.is_active).length;
      const totalDeposits = transactions
        .filter(t => t.type === 'deposit' && t.status === 'verified')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal' && (t.status === 'completed' || t.status === 'verified'))
        .reduce((sum, t) => sum + t.amount, 0);
      const pendingVerifications = transactions.filter(t => t.status === 'pending').length;
      const totalEarnings = incomes.reduce((sum, i) => sum + i.amount, 0);

      setStats({
        totalUsers,
        activeUsers,
        totalDeposits,
        totalWithdrawals,
        pendingVerifications,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Fetch recent activities from live data
  const loadRecentActivities = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const users = await getAllUsers();
      const transactions = await getAllTransactions();
      // Get latest 5 user registrations
      const userActivities = users
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(u => ({
          id: u.id,
          type: 'registration',
          user: u.name || u.email,
          time: formatDistanceToNow(new Date(u.created_at), { addSuffix: true }),
          amount: null
        }));
      // Get latest 5 transactions (deposits/withdrawals)
      const transactionActivities = transactions
        .filter(t => t.type === 'deposit' || t.type === 'withdrawal')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          type: t.type,
          user: t.user_id,
          time: formatDistanceToNow(new Date(t.created_at), { addSuffix: true }),
          amount: t.amount
        }));
      // Combine and sort by time (most recent first)
      const allActivities = [...userActivities, ...transactionActivities]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 8); // Show up to 8 most recent
      setRecentActivities(allActivities);
    } catch (error) {
      setRecentActivities([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'deposit':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'withdrawal':
        return <DollarSign className="h-4 w-4 text-red-500" />;
      case 'package':
        return <Package className="h-4 w-4 text-purple-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-100';
      case 'deposit':
        return 'bg-green-100';
      case 'withdrawal':
        return 'bg-red-100';
      case 'package':
        return 'bg-purple-100';
      default:
        return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-blue-100 mt-1">Manage your MLM platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="blue"
          change={{ value: 15.3, type: 'increase' }}
        />
        <StatsCard
          title="Active Users"
          value={stats.activeUsers}
          icon={Users}
          color="green"
          change={{ value: 8.2, type: 'increase' }}
        />
        <StatsCard
          title="Total Deposits"
          value={`₹${stats.totalDeposits.toFixed(2)}`}
          icon={DollarSign}
          color="purple"
          change={{ value: 12.5, type: 'increase' }}
        />
        <StatsCard
          title="Pending Verifications"
          value={stats.pendingVerifications}
          icon={AlertCircle}
          color="yellow"
        />
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Deposits</span>
              <span className="font-semibold text-green-600">₹{stats.totalDeposits.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Withdrawals</span>
              <span className="font-semibold text-red-600">₹{stats.totalWithdrawals.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Earnings</span>
              <span className="font-semibold text-blue-600">₹{stats.totalEarnings.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600 font-medium">Net Balance</span>
              <span className="font-bold text-purple-600">
                ₹{(stats.totalDeposits - stats.totalWithdrawals).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Statistics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Users</span>
              <span className="font-semibold text-blue-600">{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold text-green-600">{stats.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Inactive Users</span>
              <span className="font-semibold text-red-600">{stats.totalUsers - stats.activeUsers}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-gray-600 font-medium">Activation Rate</span>
              <span className="font-bold text-purple-600">
                {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {activity.type} by {activity.user}
                    </p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                {activity.amount && (
                  <div className="text-right">
                    <span className={`font-semibold ${
                      activity.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {activity.type === 'deposit' ? '+' : '-'}₹{activity.amount}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg transition-colors">
            <Users className="h-5 w-5" />
            <span>Manage Users</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg transition-colors">
            <DollarSign className="h-5 w-5" />
            <span>Verify Deposits</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-lg transition-colors">
            <Package className="h-5 w-5" />
            <span>Manage Packages</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-3 px-4 rounded-lg transition-colors">
            <TrendingUp className="h-5 w-5" />
            <span>View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;