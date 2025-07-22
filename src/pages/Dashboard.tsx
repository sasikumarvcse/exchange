import { Copy, DollarSign, Eye, Package, Share2, TrendingUp, Users, Wallet } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import IncomeChart from '../components/Dashboard/IncomeChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import StatsCard from '../components/Dashboard/StatsCard';
import { supabase } from '../lib/supabase';
import { Transaction, User } from '../types';
import { getCurrentUser } from '../utils/auth';
import { getUserNotifications, getPackageById } from '../utils/database';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [packageName, setPackageName] = useState('None');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    walletBalance: 0,
    directReferrals: 0,
    teamSize: 0,
    rightCount: 0
  });

  const [incomeData, setIncomeData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let initialLoad = true;
    const fetchDashboardData = async () => {
      try {
        if (initialLoad) setLoading(true);
        const currentUser = getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');
        setUser(currentUser);
        setReferralLink(`${window.location.origin}/register?ref=${currentUser.referral_code}`);
        
        // Fetch package name if user has a package
        if (currentUser.package_id) {
          const pkg = await getPackageById(currentUser.package_id);
          if (pkg) {
            setPackageName(pkg.name);
          }
        }

        // Fetch notifications and attach package name if upgrade
        const notif = await getUserNotifications(currentUser.id);
        const notifWithPackage = await Promise.all(
          notif.map(async (n: any) => {
            if (n.message.includes('upgraded') && currentUser.package_id) {
              const pkg = await getPackageById(currentUser.package_id);
              return {
                ...n,
                message: `Your package has been upgraded to ${pkg?.name || 'a new package'}!`
              };
            }
            return n;
          })
        );
        setNotifications(notifWithPackage);

        // Fetch all necessary data from 'profiles' instead of 'users'
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*');
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(5);
        const { data: incomesData, error: incomesError } = await supabase
          .from('incomes')
          .select('*')
          .eq('user_id', currentUser.id);
        if (usersError) throw usersError;
        if (transactionsError) throw transactionsError;
        if (incomesError) throw incomesError;
        // Always calculate referrals and team size using the latest currentUser and users
        const directReferrals = users?.filter((u: any) => u.sponsor_id === currentUser.id) || [];
        const teamSize = calculateTeamSize(currentUser.id, users || []);
        // Process income data by month
        const processedIncomeData = processIncomeData(incomesData || []);
        setStats({
          totalEarnings: currentUser.total_earnings || 0,
          walletBalance: currentUser.wallet_balance || 0,
          directReferrals: directReferrals.length,
          teamSize,
          rightCount: currentUser.right_count || 0
        });
        setTransactions(transactionsData || []);
        setIncomeData(processedIncomeData);
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        if (initialLoad) setLoading(false);
        initialLoad = false;
      }
    };
    fetchDashboardData();
    interval = setInterval(fetchDashboardData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const calculateTeamSize = (userId: string, users: User[]): number => {
    const directReferrals = users.filter(u => u.sponsor_id === userId);
    let total = directReferrals.length;
    
    directReferrals.forEach(referral => {
      total += calculateTeamSize(referral.id, users);
    });
    
    return total;
  };

  const processIncomeData = (incomes: any[]): any[] => {
    const monthlyData: Record<string, any> = {};

    incomes.forEach(income => {
      const date = new Date(income.date || income.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = {
          date: monthYear,
          directIncome: 0,
          royaltyIncome: 0
        };
      }

      switch (income.type) {
        case 'direct':
          monthlyData[monthYear].directIncome += income.amount;
          break;
        case 'royalty':
          monthlyData[monthYear].royaltyIncome += income.amount;
          break;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date)) as Array<{
      date: string;
      directIncome: number;
      royaltyIncome: number;
    }>;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Link copied to clipboard!');
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join GrowwPark MLM Platform',
        text: 'Join me on GrowwPark and start earning!',
        url: referralLink
      });
    } else {
      copyToClipboard(referralLink);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (!user) {
    return <div>User not found. Please login again.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-blue-100 mt-1">GPK ID: {user.gpk_id}</p>
            <p className="text-blue-100">Your referral code: {user.referral_code}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">${stats.walletBalance.toFixed(2)}</div>
            <div className="text-blue-100">Available Balance</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Earnings"
          value={`$${(stats.totalEarnings || 0).toFixed(2)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Direct Referrals"
          value={stats.directReferrals}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Team Size"
          value={stats.teamSize}
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="Active Package"
          value={packageName}
          icon={Package}
          color={user.package_id ? "green" : "red"}
        />
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-blue-900">Notifications</h3>
          </div>
          <ul className="divide-y divide-blue-100">
            {notifications.map((notif: any) => (
              <li key={notif.id} className={`py-2 flex flex-col ${!notif.read ? 'font-bold bg-blue-50' : ''}`}>
                <span className="text-sm text-gray-800">{notif.message}</span>
                <span className="text-xs text-gray-400">{notif.created_at ? new Date(notif.created_at).toLocaleString() : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Referral Link */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Referral Link</h3>
        <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-grow bg-transparent border-none text-gray-600 focus:ring-0"
          />
                <button
            onClick={() => copyToClipboard(referralLink)}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  <Copy className="h-4 w-4" />
            <span>Copy</span>
                </button>
                <button
            onClick={shareReferralLink}
            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
            <span>Share</span>
                </button>
        </div>
      </div>

      {/* Charts and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IncomeChart data={incomeData} />
        <RecentTransactions transactions={transactions} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center space-x-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg transition-colors">
            <Wallet className="h-5 w-5" />
            <span>Deposit GPK</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg transition-colors">
            <Package className="h-5 w-5" />
            <span>Buy Package</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-purple-50 hover:bg-purple-100 text-purple-700 py-3 px-4 rounded-lg transition-colors">
            <Eye className="h-5 w-5" />
            <span>View Tree</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 py-3 px-4 rounded-lg transition-colors">
            <TrendingUp className="h-5 w-5" />
            <span>View Income</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;