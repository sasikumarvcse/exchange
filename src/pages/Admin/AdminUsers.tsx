import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Edit, Trash2, Eye, Plus, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/supabase';
import { getAllPackages, getAllUsers } from '../../utils/database'; // Import function to get packages

type UserType = Database['public']['Tables']['profiles']['Row'];
type PackageType = Database['public']['Tables']['packages']['Row'];
type UserUpdateType = Database['public']['Tables']['profiles']['Update'];

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [packages, setPackages] = useState<PackageType[]>([]); // State for packages
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPackage, setFilterPackage] = useState('all'); // State for package filter
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'view' | 'edit' | 'delete'>('view');
  const [loading, setLoading] = useState(true); // Set initial loading state to true
  const [error, setError] = useState<string | null>(null);

  const loadData = async (isInitial = false) => {
    if (isInitial) setError(null);
    try {
      // Fetch users and packages in parallel for efficiency
      const [usersData, packagesData] = await Promise.all([
        getAllUsers(),
        getAllPackages()
      ]);
      setUsers(usersData || []);
      setPackages(packagesData || []);
    } catch (error: any) {
      if (isInitial) {
        setError('Error loading data: ' + error.message);
      } else {
        console.error('Failed to refresh data in background:', error); // Log subsequent errors silently
      }
    }
  };
  
  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await loadData(true);
      setLoading(false);
    };
    initialLoad();
  
    const interval = setInterval(() => loadData(false), 10000); // Poll for new data silently
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus, filterPackage]); // Add package filter to dependency array

  const filterUsers = () => {
    let filtered = users;
    if (searchTerm) {
      filtered = filtered.filter(user =>
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.gpk_id && user.gpk_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => {
        switch (filterStatus) {
          case 'active':
            return user.is_active;
          case 'inactive':
            return !user.is_active;
          case 'package':
            return !!user.package_id;
          default:
            return true;
        }
      });
    }
    if (filterPackage !== 'all') {
      filtered = filtered.filter(user => user.package_id === filterPackage);
    }
    setFilteredUsers(filtered);
  };

  // Helper to get package name from ID
  const getPackageName = (packageId: string | null) => {
    if (!packageId) return 'None';
    const pkg = packages.find(p => p.id === packageId);
    return pkg ? pkg.name : 'Unknown';
  };

  // Helper functions for direct referrals and team size
  const getDirectReferrals = (userId: string) => users.filter(u => u.sponsor_id === userId).length;
  const getTeamSize = (userId: string): number => {
    const direct = users.filter(u => u.sponsor_id === userId);
    let total = direct.length;
    direct.forEach(child => {
      total += getTeamSize(child.id);
    });
    return total;
  };

  const handleUserAction = (user: UserType, action: 'view' | 'edit' | 'delete') => {
    setSelectedUser(user);
    setModalType(action);
    setShowModal(true);
  };

  // For editing user details (not implemented in original, so just close modal for now)
  const handleUserUpdate = async (updatedUser: UserType) => {
    setLoading(true);
    setError(null);
      try {
      const { error } = await supabase.from('profiles').update(updatedUser as UserUpdateType).eq('id', updatedUser.id);
      if (error) throw error;
        loadData(); // Use loadData for consistency
        setShowModal(false);
    } catch (error: any) {
      setError('Error updating user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserDelete = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw error;
      loadData(); // Use loadData for consistency
    setShowModal(false);
    } catch (error: any) {
      setError('Error deleting user: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: UserType) => {
    setLoading(true);
    setError(null);
      try {
      const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
      if (error) throw error;
        loadData(); // Use loadData for consistency
    } catch (error: any) {
      setError('Error toggling user status: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>
        {/* Remove Add User button for now, as user creation is not implemented */}
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {loading && <div className="text-gray-500">Loading...</div>}
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive Users</p>
              <p className="text-2xl font-bold text-red-600">{users.filter(u => !u.is_active).length}</p>
            </div>
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <div 
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:bg-gray-50"
          onClick={() => setFilterStatus('package')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Package Users</p>
              <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.package_id).length}</p>
            </div>
            <Users className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="package">Has Package</option>
            </select>
            <select
              value={filterPackage}
              onChange={(e) => setFilterPackage(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Packages</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>
      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GPK ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Join Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {(user.name && user.name.charAt(0)) || 'U'}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.gpk_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.is_active ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.package_id ? 'bg-blue-100 text-blue-800' : 'text-gray-100 text-gray-700'
                    }`}>
                      {getPackageName(user.package_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <span className="text-blue-600">Direct: {getDirectReferrals(user.id)}</span>
                      <span className="ml-2 text-purple-600">Team: {getTeamSize(user.id)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{user.total_earnings.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleUserAction(user, 'view')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {/* Edit modal not implemented, so hide for now */}
                      {/* <button
                        onClick={() => handleUserAction(user, 'edit')}
                        className="text-green-600 hover:text-green-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button> */}
                      <button
                        onClick={() => handleUserAction(user, 'delete')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'view' && 'User Details'}
                {modalType === 'edit' && 'Edit User'}
                {modalType === 'delete' && 'Delete User'}
              </h3>
            </div>
            <div className="p-6">
              {modalType === 'view' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">GPK ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.gpk_id}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.is_active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Package</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {getPackageName(selectedUser.package_id)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Earnings</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedUser.total_earnings.toFixed(2)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Wallet Balance</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedUser.wallet_balance.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}
              {modalType === 'delete' && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Are you sure you want to delete user <strong>{selectedUser.name}</strong>?
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {modalType === 'delete' ? 'Cancel' : 'Close'}
              </button>
              {modalType === 'delete' && (
                <button
                  onClick={() => handleUserDelete(selectedUser.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;