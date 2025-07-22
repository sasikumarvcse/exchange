import { Award, Calendar, DollarSign, Download, TrendingUp, Users, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Income as IncomeType, User as UserType } from '../types';
import { getCurrentUser } from '../utils/auth';
import { getUserIncomes } from '../utils/database';

const Income: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [stats, setStats] = useState({
    totalEarnings: 0,
    directIncome: 0,
    singleIncome: 0,
    royaltyIncome: 0,
    thisMonth: 0,
    lastMonth: 0
  });

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadIncomes(currentUser.id);
    }
  }, []);

  const loadIncomes = async (userId: string) => {
    try {
      const userIncomes = await getUserIncomes(userId);
      setIncomes(userIncomes);
    } catch (error) {
      console.error('Error loading incomes:', error);
      return;
    }
    
    const userIncomes: any[] = incomes.filter((i: any) => i.user_id === currentUser.id);
    const totalEarnings = userIncomes.reduce((sum: number, i: any) => sum + i.amount, 0);
    const directIncome = userIncomes.filter((i: any) => i.type === 'direct').reduce((sum: number, i: any) => sum + i.amount, 0);
    const singleIncome = userIncomes.filter((i: any) => i.type === 'single').reduce((sum: number, i: any) => sum + i.amount, 0);
    const royaltyIncome = userIncomes.filter((i: any) => i.type === 'royalty').reduce((sum: number, i: any) => sum + i.amount, 0);
    
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
      directIncome,
      singleIncome,
      royaltyIncome,
      thisMonth,
      lastMonth
    });
  };

  const filteredIncomes = incomes.filter(income => {
    const matchesType = selectedType === 'all' || income.type === selectedType;
    
    if (selectedPeriod === 'all') return matchesType;
    
    const incomeDate = new Date(income.date);
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        return matchesType && incomeDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return matchesType && incomeDate >= weekAgo;
      case 'month':
        return matchesType && incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
      case 'year':
        return matchesType && incomeDate.getFullYear() === now.getFullYear();
      default:
        return matchesType;
    }
  });

  const getIncomeTypeColor = (type: string) => {
    switch (type) {
      case 'direct':
        return 'bg-blue-100 text-blue-800';
      case 'royalty':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIncomeTypeIcon = (type: string) => {
    switch (type) {
      case 'direct':
        return <DollarSign className="h-4 w-4" />;
      case 'royalty':
        return <Award className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const exportIncomes = () => {
    const csvContent = [
      ['Date', 'Type', 'Amount', 'Description', 'Level'].join(','),
      ...filteredIncomes.map(income => [
        new Date(income.date).toLocaleDateString(),
        income.type,
        income.amount.toFixed(2),
        income.description,
        income.level || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Overview</h1>
          <p className="text-gray-600">Track your earnings and income sources</p>
        </div>
        <button
          onClick={exportIncomes}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{(stats.totalEarnings || 0).toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-green-600">₹{stats.thisMonth.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Last Month</p>
              <p className="text-2xl font-bold text-purple-600">₹{stats.lastMonth.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Growth Rate</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.lastMonth > 0 ? '+' : ''}{stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) : '0'}%
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Income Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Direct Income</h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-600">₹{stats.directIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500">From direct referrals</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Single Income</h3>
            <User className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-indigo-600">₹{stats.singleIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500">From single leg</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Royalty Income</h3>
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-xl font-bold text-yellow-600">₹{stats.royaltyIncome.toFixed(2)}</p>
          <p className="text-xs text-gray-500">From global pool</p>
        </div>
      </div>

      {/* Filters and Income List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Income History</h3>
            <div className="flex space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="direct">Direct Income</option>
                <option value="royalty">Royalty Income</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIncomes.map((income) => (
                <tr key={income.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(income.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getIncomeTypeColor(income.type)}`}>
                        {getIncomeTypeIcon(income.type)}
                        <span className="ml-1 capitalize">{income.type}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    +₹{income.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {income.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {income.level ? `Level ${income.level}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredIncomes.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No income records found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your income history will appear here as you earn.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Income;