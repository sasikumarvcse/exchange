import { Eye, Search, TrendingUp, UserPlus, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import BinaryTreeVisualization from '../../components/BinaryTree/BinaryTreeVisualization';
import { User } from '../../types';
import { storage } from '../../utils/storage';
import { getAllUsers } from '../../utils/database';

const AdminReferrals: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTree, setShowTree] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
        if (fetchedUsers.length > 0) {
          setSelectedUser(fetchedUsers[0]);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
    const interval = setInterval(loadUsers, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const filterUsers = () => {
      let filtered = users;

      if (searchTerm) {
        filtered = filtered.filter(user =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.gpk_id?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setFilteredUsers(filtered);
    };

    filterUsers();
  }, [users, searchTerm]);

  const getReferralStats = (user: User) => {
    const directReferrals = users.filter(u => u.sponsor_id === user.id);
    const totalTeam = calculateTeamSize(user.id);
    const activeTeam = calculateActiveTeam(user.id);
    
    return {
      directReferrals: directReferrals.length,
      totalTeam,
      activeTeam,
      rightCount: user.right_count || 0
    };
  };

  const calculateTeamSize = (userId: string): number => {
    const directReferrals = users.filter(u => u.sponsor_id === userId);
    let total = directReferrals.length;
    
    directReferrals.forEach(referral => {
      total += calculateTeamSize(referral.id);
    });
    
    return total;
  };

  const calculateActiveTeam = (userId: string): number => {
    const directReferrals = users.filter(u => u.sponsor_id === userId);
    let active = directReferrals.filter(u => u.is_active).length;
    
    directReferrals.forEach(referral => {
      active += calculateActiveTeam(referral.id);
    });
    
    return active;
  };

  const getTopPerformers = () => {
    return users
      .map(user => ({
        ...user,
        stats: getReferralStats(user)
      }))
      .sort((a, b) => (b.stats?.totalTeam || 0) - (a.stats?.totalTeam || 0))
      .slice(0, 10);
  };

  const totalUsers = users.length;
  const totalReferrals = users.filter(u => u.sponsor_id).length;
  const averageTeamSize = users.length > 0 ? 
    users.reduce((sum, u) => sum + (getReferralStats(u).totalTeam || 0), 0) / users.length : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
          <p className="text-gray-600">Monitor and manage the referral network</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTree(!showTree)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!selectedUser}
          >
            <Eye className="h-4 w-4" />
            <span>{showTree ? 'Hide Tree' : 'View Tree'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{totalUsers}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Referrals</p>
              <p className="text-2xl font-bold text-green-600">{totalReferrals}</p>
            </div>
            <UserPlus className="h-10 w-10 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Team Size</p>
              <p className="text-2xl font-bold text-purple-600">{averageTeamSize.toFixed(1)}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Referral Rate</p>
              <p className="text-2xl font-bold text-yellow-600">
                {totalUsers > 0 ? ((totalReferrals / totalUsers) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      {showTree && selectedUser && (
        <BinaryTreeVisualization rootUser={selectedUser} maxLevels={5} />
      )}

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Direct Referrals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Binary (L/R)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getTopPerformers().map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-yellow-600' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500">{user.gpk_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.stats.directReferrals}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.stats.totalTeam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.stats.activeTeam}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <span className="text-purple-600">R: {user.stats.rightCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowTree(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Search & Tree Selection */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Search User Tree</h3>
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowTree(true)}
            disabled={!selectedUser}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            View Tree
          </button>
        </div>
        
        {filteredUsers.length > 0 && searchTerm && (
          <div className="mt-4 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                  selectedUser?.id === user.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{user.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{user.gpk_id} • {user.email}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Team: {getReferralStats(user).totalTeam}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReferrals;