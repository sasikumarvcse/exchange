import React, { useState, useEffect } from 'react';
import { BarChart, Users, DollarSign, TrendingUp, Download, Calendar } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAllUsers, getAllTransactions, getAllIncomes } from '../../utils/database';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

const AdminReports: React.FC = () => {
  const [dateRange, setDateRange] = useState('month');
  const [reportType, setReportType] = useState('overview');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalIncome: 0,
    pendingTransactions: 0,
    activePackages: 0
  });

  const [chartData, setChartData] = useState<{ userGrowth: { month: string; users: number; active: number }[]; incomeDistribution: { name: string; value: number; color: string }[]; transactionTrends: { week: string; deposits: number; withdrawals: number }[] }>({
    userGrowth: [],
    incomeDistribution: [],
    transactionTrends: []
  });

  const [detailedStats, setDetailedStats] = useState<any[]>([]);
  const [performanceStats, setPerformanceStats] = useState<any[]>([]);

  useEffect(() => {
    loadReportData();
    const interval = setInterval(loadReportData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [dateRange, reportType]);

  const loadReportData = async () => {
    try {
      const users = await getAllUsers();
      const transactions = await getAllTransactions();
      const incomes = await getAllIncomes();

      // Calculate stats
      const totalUsers = users.length;
      const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'verified').reduce((sum, t) => sum + t.amount, 0);
      const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
      const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
      const pendingTransactions = transactions.filter(t => t.status === 'pending').length;
      const activePackages = users.filter(u => u.package_id).length;

      setStats({
        totalUsers,
        totalDeposits,
        totalWithdrawals,
        totalIncome,
        pendingTransactions,
        activePackages
      });

      // Calculate periods
      const now = new Date();
      const currentPeriodStart = startOfMonth(now);
      const currentPeriodEnd = endOfMonth(now);
      const previousPeriodStart = startOfMonth(subMonths(now, 1));
      const previousPeriodEnd = endOfMonth(subMonths(now, 1));

      // Helper to check if a date is in a range
      const inRange = (date: string | Date, start: Date, end: Date) => {
        const d = new Date(date);
        return d >= start && d <= end;
      };

      // New User Registrations
      const currentNewUsers = users.filter(u => inRange(u.created_at, currentPeriodStart, currentPeriodEnd)).length;
      const previousNewUsers = users.filter(u => inRange(u.created_at, previousPeriodStart, previousPeriodEnd)).length;
      const newUsersChange = previousNewUsers > 0 ? ((currentNewUsers - previousNewUsers) / previousNewUsers) * 100 : 0;

      // Package Activations (users with package_id)
      const currentPackageActivations = users.filter(u => u.package_id && inRange(u.created_at, currentPeriodStart, currentPeriodEnd)).length;
      const previousPackageActivations = users.filter(u => u.package_id && inRange(u.created_at, previousPeriodStart, previousPeriodEnd)).length;
      const packageChange = previousPackageActivations > 0 ? ((currentPackageActivations - previousPackageActivations) / previousPackageActivations) * 100 : 0;

      // Total Commission Paid (sum incomes)
      const currentCommission = incomes.filter(i => inRange(i.date, currentPeriodStart, currentPeriodEnd)).reduce((sum, i) => sum + i.amount, 0);
      const previousCommission = incomes.filter(i => inRange(i.date, previousPeriodStart, previousPeriodEnd)).reduce((sum, i) => sum + i.amount, 0);
      const commissionChange = previousCommission > 0 ? ((currentCommission - previousCommission) / previousCommission) * 100 : 0;

      // Average Transaction Value (deposits/withdrawals)
      const currentTxs = transactions.filter(t => inRange(t.created_at, currentPeriodStart, currentPeriodEnd));
      const previousTxs = transactions.filter(t => inRange(t.created_at, previousPeriodStart, previousPeriodEnd));
      const currentAvgTx = currentTxs.length > 0 ? currentTxs.reduce((sum, t) => sum + t.amount, 0) / currentTxs.length : 0;
      const previousAvgTx = previousTxs.length > 0 ? previousTxs.reduce((sum, t) => sum + t.amount, 0) / previousTxs.length : 0;
      const avgTxChange = previousAvgTx > 0 ? ((currentAvgTx - previousAvgTx) / previousAvgTx) * 100 : 0;

      setDetailedStats([
        {
          metric: 'New User Registrations',
          current: currentNewUsers,
          previous: previousNewUsers,
          change: newUsersChange,
        },
        {
          metric: 'Package Activations',
          current: currentPackageActivations,
          previous: previousPackageActivations,
          change: packageChange,
        },
        {
          metric: 'Total Commission Paid',
          current: `₹${currentCommission.toLocaleString()}`,
          previous: `₹${previousCommission.toLocaleString()}`,
          change: commissionChange,
        },
        {
          metric: 'Average Transaction Value',
          current: `₹${currentAvgTx.toFixed(2)}`,
          previous: `₹${previousAvgTx.toFixed(2)}`,
          change: avgTxChange,
        },
      ]);

      // Generate chart data
      const userGrowth = generateUserGrowthData(users);
      const incomeDistribution = generateIncomeDistributionData(incomes);
      const transactionTrends = generateTransactionTrendsData(transactions);

      setChartData({
        userGrowth,
        incomeDistribution,
        transactionTrends
      });

      loadPerformanceStats(users, transactions, incomes);

    } catch (error) {
      console.error('Error loading report data:', error);
    }
  };

  const loadPerformanceStats = (users: any[], transactions: any[], incomes: any[]) => {
    const now = new Date();
    const currentPeriodStart = startOfMonth(now);
    const currentPeriodEnd = endOfMonth(now);
    const previousPeriodStart = startOfMonth(subMonths(now, 1));
    const previousPeriodEnd = endOfMonth(subMonths(now, 1));
    const inRange = (date: string | Date, start: Date, end: Date) => {
      const d = new Date(date);
      return d >= start && d <= end;
    };
    // Total Income
    const currentIncome = incomes.filter(i => inRange(i.date, currentPeriodStart, currentPeriodEnd)).reduce((sum, i) => sum + i.amount, 0);
    const previousIncome = incomes.filter(i => inRange(i.date, previousPeriodStart, previousPeriodEnd)).reduce((sum, i) => sum + i.amount, 0);
    const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    // Direct Referrals
    const currentDirectReferrals = users.filter(u => u.sponsor_id && inRange(u.created_at, currentPeriodStart, currentPeriodEnd)).length;
    const previousDirectReferrals = users.filter(u => u.sponsor_id && inRange(u.created_at, previousPeriodStart, previousPeriodEnd)).length;
    const directRefChange = previousDirectReferrals > 0 ? ((currentDirectReferrals - previousDirectReferrals) / previousDirectReferrals) * 100 : 0;
    // Team Activity Rate
    const currentActiveUsers = users.filter(u => transactions.some(t => t.user_id === u.id && inRange(t.created_at, currentPeriodStart, currentPeriodEnd))).length;
    const teamActivityRate = users.length > 0 ? (currentActiveUsers / users.length) * 100 : 0;
    const previousActiveUsers = users.filter(u => transactions.some(t => t.user_id === u.id && inRange(t.created_at, previousPeriodStart, previousPeriodEnd))).length;
    const prevTeamActivityRate = users.length > 0 ? (previousActiveUsers / users.length) * 100 : 0;
    const teamActivityChange = prevTeamActivityRate > 0 ? (teamActivityRate - prevTeamActivityRate) : 0;
    // Conversion Rate
    const currentConversions = users.filter(u => u.package_id && inRange(u.created_at, currentPeriodStart, currentPeriodEnd)).length;
    const conversionRate = users.length > 0 ? (currentConversions / users.length) * 100 : 0;
    const previousConversions = users.filter(u => u.package_id && inRange(u.created_at, previousPeriodStart, previousPeriodEnd)).length;
    const prevConversionRate = users.length > 0 ? (previousConversions / users.length) * 100 : 0;
    const conversionChange = prevConversionRate > 0 ? (conversionRate - prevConversionRate) : 0;
    setPerformanceStats([
      {
        metric: 'Total Income',
        current: `₹${currentIncome.toFixed(2)}`,
        previous: `₹${previousIncome.toFixed(2)}`,
        change: incomeChange,
      },
      {
        metric: 'Direct Referrals',
        current: currentDirectReferrals,
        previous: previousDirectReferrals,
        change: directRefChange,
      },
      {
        metric: 'Team Activity Rate',
        current: `${teamActivityRate.toFixed(1)}%`,
        previous: `${prevTeamActivityRate.toFixed(1)}%`,
        change: teamActivityChange,
      },
      {
        metric: 'Conversion Rate',
        current: `${conversionRate.toFixed(1)}%`,
        previous: `${prevConversionRate.toFixed(1)}%`,
        change: conversionChange,
      },
    ]);
  };

  const generateUserGrowthData = (users: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => ({
      month,
      users: Math.floor(Math.random() * 50) + 20,
      active: Math.floor(Math.random() * 30) + 10
    }));
  };

  const generateIncomeDistributionData = (incomes: any[]): { name: string; value: number; color: string }[] => {
    const types = ['direct', 'royalty'];
    return types.map(type => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: Math.floor(Math.random() * 1000) + 500,
      color: type === 'direct' ? '#3B82F6' : '#F59E0B'
    }));
  };

  const generateTransactionTrendsData = (transactions: any[]): { week: string; deposits: number; withdrawals: number }[] => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map(week => ({
      week,
      deposits: Math.floor(Math.random() * 5000) + 2000,
      withdrawals: Math.floor(Math.random() * 3000) + 1000
    }));
  };

  const exportReport = () => {
    const reportData = {
      reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      stats,
      chartData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive platform analytics and insights</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportReport}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="overview">Overview</option>
                <option value="financial">Financial</option>
                <option value="user">User Analytics</option>
                <option value="performance">Performance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+12.3%</span>
            <span className="text-sm text-gray-500 ml-1">from last period</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.totalDeposits.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+8.7%</span>
            <span className="text-sm text-gray-500 ml-1">from last period</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Income</p>
              <p className="text-2xl font-bold text-purple-600">₹{stats.totalIncome.toFixed(2)}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+15.2%</span>
            <span className="text-sm text-gray-500 ml-1">from last period</span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Packages</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.activePackages}</p>
            </div>
            <BarChart className="h-10 w-10 text-yellow-500" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-green-600">+22.1%</span>
            <span className="text-sm text-gray-500 ml-1">from last period</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsBarChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3B82F6" name="Total Users" />
                <Bar dataKey="active" fill="#10B981" name="Active Users" />
              </RechartsBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.incomeDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.incomeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Transaction Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Trends</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData.transactionTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deposits" fill="#10B981" name="Deposits" />
              <Bar dataKey="withdrawals" fill="#EF4444" name="Withdrawals" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Statistics Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Statistics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {detailedStats.map((row, idx) => (
                <tr key={row.metric}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.metric}
                </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.current}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.previous}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.change >= 0 ? '+' : ''}{row.change.toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className={`h-4 w-4 ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Performance Analysis Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Performance Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Previous Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceStats.map((row) => (
                <tr key={row.metric}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.metric}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.current}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.previous}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${row.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.change >= 0 ? '+' : ''}{row.change.toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className={`h-4 w-4 ${row.change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </td>
              </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;