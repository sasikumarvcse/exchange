import {
  Award,
  BarChart,
  Calendar,
  DollarSign,
  Download,
  PieChart,
  RefreshCw,
  Target,
  TrendingUp,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { storage } from '../utils/storage';
import { User } from '../types';
import { Income } from '../types';
import { supabase } from '../lib/supabase';

// 1. Define a ChartData interface/type for chartData state.
interface ChartData {
  incomeBreakdown: { name: string; value: number; color: string; percentage: number }[];
  monthlyTrends: { month: string; directIncome: number; royaltyIncome: number; total: number }[];
  teamGrowth: { period: string; total: number }[];
  performanceMetrics: { metric: string; current: number; previous: number; target: number }[];
  weeklyEarnings: { week: string; earnings: number; target: number }[];
}

const Reports: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<User[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');
  // 2. Use ChartData in useState and setChartData.
  const [chartData, setChartData] = useState<ChartData>({
    incomeBreakdown: [],
    monthlyTrends: [],
    teamGrowth: [],
    performanceMetrics: [],
    weeklyEarnings: []
  });

  const [stats, setStats] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    lastMonth: 0,
    directReferrals: 0,
    teamSize: 0,
    activeMembers: 0,
    conversionRate: 0,
    avgMonthlyGrowth: 0
  });

  const getCurrentUser = () => {
    const user = storage.get('user');
    if (!user) {
      throw new Error('User not found in storage');
    }
    return user;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');
        setUser(currentUser);
        const { data: users, error: usersError } = await supabase.from('profiles').select('*');
        const { data: incomes, error: incomesError } = await supabase.from('incomes').select('*');
        if (usersError) throw usersError;
        if (incomesError) throw incomesError;
        setData(users);
        // Debug logs
        console.log('Fetched users:', users);
        console.log('Fetched incomes:', incomes);
        // Always calculate team size using the latest currentUser and users
        const teamSize = calculateTeamSize(currentUser.id, users);
        const directReferrals = users.filter((u: any) => u.sponsor_id === currentUser.id);
        const activeMembers = users.filter((u: any) => u.sponsor_id === currentUser.id && u.is_active).length;
        // Calculate earnings
        const userIncomes = incomes.filter((i: any) => i.user_id === currentUser.id);
        console.log('User incomes:', userIncomes);
        const totalEarnings = userIncomes.reduce((sum: number, i: any) => sum + i.amount, 0);
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const thisMonth = userIncomes.filter((i: any) => {
          const incomeDate = new Date(i.date);
          return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
        }).reduce((sum: number, i: any) => sum + i.amount, 0);
        const lastMonth = userIncomes.filter((i: any) => {
          const incomeDate = new Date(i.date);
          const lastMonthDate = new Date(currentYear, currentMonth - 1);
          return incomeDate.getMonth() === lastMonthDate.getMonth() && incomeDate.getFullYear() === lastMonthDate.getFullYear();
        }).reduce((sum: number, i: any) => sum + i.amount, 0);
        setStats({
          totalEarnings,
          thisMonth,
          lastMonth,
          directReferrals: directReferrals.length,
          teamSize, // <-- always use this value
          activeMembers,
          conversionRate: directReferrals.length > 0 ? (activeMembers / directReferrals.length) * 100 : 0,
          avgMonthlyGrowth: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0
        });
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
    interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);


  const generateReportData = async (currentUser: User) => {
    setLoading(true);
    
    // Simulate loading delay
    setTimeout(async () => {
      const { data: users } = await supabase.from('profiles').select('*');
      const { data: incomes } = await supabase.from('incomes').select('*');
      const userIncomes = incomes?.filter((income: Income) => income.user_id === currentUser.id) || [];
      
      // Calculate stats
      const totalEarnings = userIncomes.reduce((sum: number, income: Income) => sum + income.amount, 0);
      const directReferrals = users?.filter((u: User) => u.sponsor_id === currentUser.id).length || 0;
      const teamSize = calculateTeamSize(currentUser.id, users || []);
      const activeMembers = users?.filter((u: User) => u.sponsor_id === currentUser.id && u.is_active).length || 0;
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonth = userIncomes.filter((i: Income) => {
        const incomeDate = new Date(i.date);
        return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear;
      }).reduce((sum: number, i: Income) => sum + i.amount, 0);
      
      const lastMonth = userIncomes.filter((i: Income) => {
        const incomeDate = new Date(i.date);
        const lastMonthDate = new Date(currentYear, currentMonth - 1);
        return incomeDate.getMonth() === lastMonthDate.getMonth() && incomeDate.getFullYear() === lastMonthDate.getFullYear();
      }).reduce((sum: number, i: Income) => sum + i.amount, 0);

      setStats({
        totalEarnings,
        thisMonth,
        lastMonth,
        directReferrals,
        teamSize,
        activeMembers,
        conversionRate: directReferrals > 0 ? (activeMembers / directReferrals) * 100 : 0,
        avgMonthlyGrowth: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0
      });

      // Live income breakdown
      const incomeTypes = ['direct', 'royalty'];
      const incomeBreakdown = incomeTypes.map(type => {
        const value = userIncomes.filter(i => i.type === type).reduce((sum, i) => sum + i.amount, 0);
        return {
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Income`,
          value,
          color: type === 'direct' ? '#3B82F6' : '#F59E0B',
          percentage: totalEarnings > 0 ? (value / totalEarnings) * 100 : 0
        };
      });
      // Live monthly trends
      const months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d;
      });
      const monthlyTrends = months.map(monthDate => {
        const month = monthDate.toLocaleString('default', { month: 'short' });
        const year = monthDate.getFullYear();
        const directIncome = userIncomes.filter(i => i.type === 'direct' && new Date(i.date).getMonth() === monthDate.getMonth() && new Date(i.date).getFullYear() === year).reduce((sum, i) => sum + i.amount, 0);
        const royaltyIncome = userIncomes.filter(i => i.type === 'royalty' && new Date(i.date).getMonth() === monthDate.getMonth() && new Date(i.date).getFullYear() === year).reduce((sum, i) => sum + i.amount, 0);
        const total = directIncome + royaltyIncome;
        return { month, directIncome, royaltyIncome, total };
      });
      // Live team growth (by week)
      const now = new Date();
      const teamGrowth = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (21 - i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const total = users.filter(u => u.sponsor_id === currentUser.id && new Date(u.created_at) >= weekStart && new Date(u.created_at) <= weekEnd).length;
        return { period: `Week ${i + 1}`, total };
      });
      // Live performance metrics
      const conversionRate = directReferrals > 0 ? (activeMembers / directReferrals) * 100 : 0;
      const teamActivity = teamSize > 0 ? (activeMembers / teamSize) * 100 : 0;
      const incomeGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100) : 0;
      const retentionRate = teamSize > 0 ? (activeMembers / teamSize) * 100 : 0;
      const performanceMetrics = [
        { metric: 'Conversion Rate', current: conversionRate, previous: 0, target: 80 },
        { metric: 'Team Activity', current: teamActivity, previous: 0, target: 90 },
        { metric: 'Income Growth', current: incomeGrowth, previous: 0, target: 25 },
        { metric: 'Retention Rate', current: retentionRate, previous: 0, target: 95 }
      ];
      // Live weekly earnings
      const weeklyEarnings = Array.from({ length: 6 }, (_, i) => {
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (35 - i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const earnings = userIncomes.filter(i => new Date(i.date) >= weekStart && new Date(i.date) <= weekEnd).reduce((sum, i) => sum + i.amount, 0);
        return { week: `W${i + 1}`, earnings, target: 0 };
      });
      setChartData({
        incomeBreakdown,
        monthlyTrends,
        teamGrowth,
        performanceMetrics,
        weeklyEarnings
      });
      
      setLoading(false);
    }, 1000);
  };

  const calculateTeamSize = (userId: string, users: any[]): number => {
    const directReferrals = users.filter((u: any) => u.sponsor_id === userId);
    let total = directReferrals.length;
    
    directReferrals.forEach((referral: any) => {
      total += calculateTeamSize(referral.id, users);
    });
    
    return total;
  };

  const exportReport = () => {
    const reportData = {
      user: user?.name,
      gpkId: user?.gpk_id,
      reportType,
      dateRange,
      generatedAt: new Date().toISOString(),
      stats,
      data: chartData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const refreshData = () => {
    if (user) {
      generateReportData(user);
    }
  };

  const renderIncomeBreakdown = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Income Distribution</h3>
        <PieChart className="h-5 w-5 text-gray-400" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={chartData.incomeBreakdown}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, percentage }) => `${percentage}%`}
              >
                {chartData.incomeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4">
          {chartData.incomeBreakdown.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">${item.value}</div>
                <div className="text-xs text-gray-500">{item.percentage}%</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMonthlyTrends = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Monthly Income Trends</h3>
        <TrendingUp className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData.monthlyTrends}>
            <defs>
              <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#3B82F6" 
              fillOpacity={1} 
              fill="url(#totalGradient)"
              name="Total Income"
            />
            <Line type="monotone" dataKey="directIncome" stroke="#10B981" name="Direct Income" />
            <Line type="monotone" dataKey="royaltyIncome" stroke="#F59E0B" name="Royalty Income" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderPerformanceMetrics = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
        <Target className="h-5 w-5 text-gray-400" />
      </div>
      <div className="space-y-6">
        {chartData.performanceMetrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{metric.metric}</span>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Target: {metric.target}%</span>
                <span className="text-sm font-semibold text-gray-900">{metric.current}%</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(metric.current / metric.target) * 100}%` }}
                ></div>
              </div>
              <div 
                className="absolute top-0 w-1 h-2 bg-red-400 rounded-full"
                style={{ left: `${(metric.target / 100) * 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Previous: {metric.previous}%</span>
              <span className={`font-medium ${metric.current > metric.previous ? 'text-green-600' : 'text-red-600'}`}>
                {metric.current > metric.previous ? '+' : ''}{(metric.current - metric.previous).toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWeeklyEarnings = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Weekly Earnings vs Target</h3>
        <BarChart className="h-5 w-5 text-gray-400" />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={chartData.weeklyEarnings}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="earnings" fill="#3B82F6" name="Actual Earnings" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" fill="#E5E7EB" name="Target" radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your MLM performance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                <option value="income">Income Analysis</option>
                <option value="team">Team Performance</option>
                <option value="growth">Growth Metrics</option>
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
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Last updated: {new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">${stats.totalEarnings.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${stats.avgMonthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stats.avgMonthlyGrowth >= 0 ? '+' : ''}{stats.avgMonthlyGrowth.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">from last month</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Team Size</p>
              <p className="text-2xl font-bold text-blue-600">{stats.teamSize}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">Active: {stats.activeMembers}</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">Target: 80%</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-yellow-600">${stats.thisMonth.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-600">Last: ${stats.lastMonth.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderIncomeBreakdown()}
        {renderPerformanceMetrics()}
      </div>

      {/* Full Width Charts */}
      <div className="space-y-6">
        {renderMonthlyTrends()}
        {renderWeeklyEarnings()}
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total Income
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stats.thisMonth.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${stats.lastMonth.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+{stats.avgMonthlyGrowth.toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Direct Referrals
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.directReferrals}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Math.max(0, stats.directReferrals - 3)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+25.0%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Team Activity Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">85.2%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">82.1%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+3.8%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Conversion Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stats.conversionRate.toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{Math.max(0, stats.conversionRate - 5).toFixed(1)}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">+6.7%</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-gray-900">Generating report...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;