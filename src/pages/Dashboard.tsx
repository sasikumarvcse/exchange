import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Award, 
  Crown, 
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { MLMService } from '../lib/supabase';
import { User, IncomesSummary, TeamMember } from '../types';
import IncomeChart from '../components/Dashboard/IncomeChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import StatsCard from '../components/Dashboard/StatsCard';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [incomesSummary, setIncomesSummary] = useState<IncomesSummary>({
    total: 0,
    direct: 0,
    level: 0,
    global_royalty: 0,
    count: 0
  });
  const [teamStructure, setTeamStructure] = useState<TeamMember[]>([]);
  const [qualifiedLevel, setQualifiedLevel] = useState(0);
  const [recentIncomes, setRecentIncomes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user.id]);

  const loadDashboardData = async () => {
    try {
      const [
        summary,
        team,
        level,
        incomes
      ] = await Promise.all([
        MLMService.getIncomesSummary(user.id),
        MLMService.getTeamStructure(user.id, 2),
        MLMService.getUserLevelQualification(user.id),
        MLMService.getUserIncomes(user.id)
      ]);

      setIncomesSummary(summary);
      setTeamStructure(team);
      setQualifiedLevel(level);
      setRecentIncomes(incomes.slice(0, 10)); // Last 10 incomes
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPackageBadgeColor = (packageName: string) => {
    const colors = {
      starter: 'bg-green-100 text-green-800',
      silver: 'bg-gray-100 text-gray-800',
      gold: 'bg-yellow-100 text-yellow-800',
      platinum: 'bg-blue-100 text-blue-800',
      diamond: 'bg-purple-100 text-purple-800'
    };
    return colors[packageName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Welcome back, {user.name}!</h1>
                <p className="text-blue-100 mb-4">Your MLM Dashboard Overview</p>
                <div className="flex items-center space-x-6">
                  <div>
                    <p className="text-sm text-blue-100">GPK ID</p>
                    <p className="text-xl font-semibold">{user.gpk_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Referral Code</p>
                    <p className="text-xl font-semibold">{user.referral_code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-100">Current Package</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getPackageBadgeColor(user.current_package)}`}>
                      {user.current_package === 'none' ? 'No Package' : user.current_package}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-lg p-4">
                  <p className="text-sm text-blue-100">Qualified Level</p>
                  <p className="text-3xl font-bold">{qualifiedLevel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Earnings"
            value={formatCurrency(user.total_earnings)}
            icon={DollarSign}
            color="green"
            trend={incomesSummary.count > 0 ? 'up' : 'neutral'}
          />
          <StatsCard
            title="Wallet Balance"
            value={formatCurrency(user.wallet_balance)}
            icon={TrendingUp}
            color="blue"
            trend="neutral"
          />
          <StatsCard
            title="Direct Referrals"
            value={user.direct_referrals.toString()}
            icon={Users}
            color="purple"
            trend={user.direct_referrals > 0 ? 'up' : 'neutral'}
          />
          <StatsCard
            title="Team Size"
            value={user.team_size.toString()}
            icon={Target}
            color="orange"
            trend={user.team_size > 0 ? 'up' : 'neutral'}
          />
        </div>

        {/* Income Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Direct Income</h3>
              <div className="bg-green-100 p-2 rounded-lg">
                <Target className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(incomesSummary.direct)}
            </p>
            <p className="text-sm text-gray-600">25% from direct referrals</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Level Income</h3>
              <div className="bg-blue-100 p-2 rounded-lg">
                <Award className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-blue-600 mb-2">
              {formatCurrency(incomesSummary.level)}
            </p>
            <p className="text-sm text-gray-600">Up to 15% from team levels</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Global Royalty</h3>
              <div className="bg-purple-100 p-2 rounded-lg">
                <Crown className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              {formatCurrency(incomesSummary.global_royalty)}
            </p>
            <p className="text-sm text-gray-600">15% pool every 90 days</p>
          </div>
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Income Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Overview</h3>
            <IncomeChart incomes={recentIncomes} />
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Income</h3>
            <RecentTransactions transactions={recentIncomes} />
          </div>
        </div>

        {/* Team Structure */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Team Structure</h3>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Level {qualifiedLevel} Qualified
            </span>
          </div>
          
          {teamStructure.length > 0 ? (
            <div className="space-y-4">
              {teamStructure.map((member) => (
                <div key={member.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.gpk_id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Package</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getPackageBadgeColor(member.current_package)}`}>
                        {member.current_package === 'none' ? 'No Package' : member.current_package}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Team Size</p>
                      <p className="font-semibold">{member.team_size}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Earnings</p>
                      <p className="font-semibold">{formatCurrency(member.total_earnings)}</p>
                    </div>
                  </div>
                  
                  {member.team && member.team.length > 0 && (
                    <div className="mt-4 ml-8 space-y-2">
                      {member.team.slice(0, 3).map((subMember) => (
                        <div key={subMember.id} className="flex items-center space-x-3 py-2 px-3 bg-gray-50 rounded">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <span className="text-sm text-gray-700">{subMember.name}</span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getPackageBadgeColor(subMember.current_package)}`}>
                            {subMember.current_package === 'none' ? 'No Package' : subMember.current_package}
                          </span>
                        </div>
                      ))}
                      {member.team.length > 3 && (
                        <p className="text-sm text-gray-500 ml-5">+{member.team.length - 3} more members</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No team members yet</p>
              <p className="text-sm text-gray-500">Start referring people to build your team</p>
            </div>
          )}
        </div>

        {/* Level Requirements */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Level Qualification Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((level) => {
              const isQualified = qualifiedLevel >= level;
              const teamRequired = Math.pow(5, level);
              
              return (
                <div key={level} className={`border-2 rounded-lg p-4 ${isQualified ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${isQualified ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {isQualified ? '✓' : level}
                    </div>
                    <h4 className="font-semibold">Level {level}</h4>
                    <p className="text-sm text-gray-600">Team: {teamRequired}</p>
                    <p className="text-xs text-gray-500">Income: 1%</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Current Progress</span>
            </div>
            <p className="text-sm text-blue-800 mt-1">
              You have qualified for Level {qualifiedLevel} with {user.team_size} team members. 
              {qualifiedLevel < 10 && ` Reach ${Math.pow(5, qualifiedLevel + 1)} team members for Level ${qualifiedLevel + 1}.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}