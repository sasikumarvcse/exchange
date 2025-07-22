import React, { useState, useEffect } from 'react';
import { DollarSign, Search, Filter, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { getAllTransactions, getAllUsers, updateTransaction, updateUser, getAllPackages } from '../../utils/database';
import { Transaction, User } from '../../types';

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  // Add a quick filter for pending deposits
  const [showPendingDeposits, setShowPendingDeposits] = useState(false);
  const [txHashInput, setTxHashInput] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [filterPackage, setFilterPackage] = useState('all');

  useEffect(() => {
    loadTransactions();
    loadUsers();
    loadPackages();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, filterStatus, showPendingDeposits, filterPackage]);

  useEffect(() => {
    if (showModal && selectedTransaction && selectedTransaction.tx_hash) {
      setTxHashInput(selectedTransaction.tx_hash);
    } else {
      setTxHashInput('');
    }
  }, [showModal, selectedTransaction]);

  const loadTransactions = () => {
    const fetchTransactions = async () => {
      try {
        const allTransactions = await getAllTransactions();
        setTransactions(allTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
      }
    };
    fetchTransactions();
  };

  const loadUsers = () => {
    const fetchUsers = async () => {
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    fetchUsers();
  };

  const loadPackages = () => {
    const fetchPackages = async () => {
      try {
        const allPackages = await getAllPackages();
        setPackages(allPackages);
      } catch (error) {
        console.error('Error loading packages:', error);
      }
    };
    fetchPackages();
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (showPendingDeposits) {
      filtered = filtered.filter(t => t.type === 'deposit' && t.status === 'pending');
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction => {
        const user = users.find(u => u.id === transaction.user_id);
        return (
          transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.tx_hash?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user?.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filterType);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === filterStatus);
    }

    // Apply package filter
    if (filterPackage !== 'all') {
      filtered = filtered.filter(transaction => {
        const user = users.find(u => u.id === transaction.user_id);
        return user && user.package_id === filterPackage;
      });
    }

    setFilteredTransactions(filtered);
  };

  const getUserById = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const handleTransactionAction = (transaction: Transaction, action: 'approve' | 'reject') => {
    const processTransaction = async () => {
      try {
        const updatedStatus = action === 'approve' ? 'verified' : 'rejected';
        // Removed manual wallet_balance update for deposits. Supabase trigger will handle it.
        await updateTransaction(transaction.id, { status: updatedStatus });
        loadTransactions();
        setShowModal(false);
      } catch (error) {
        console.error('Error processing transaction:', error);
      }
    };
    processTransaction();
  };

  const handleWithdrawalVerify = async () => {
    if (!selectedTransaction) return;
    try {
      await updateTransaction(selectedTransaction.id, { status: 'verified', tx_hash: txHashInput });
      loadTransactions();
      setShowModal(false);
    } catch (error) {
      console.error('Error verifying withdrawal:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  const totalDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'verified').reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'verified').reduce((sum, t) => sum + t.amount, 0);
  const totalFees = transactions.filter(t => t.status === 'verified' || t.status === 'completed').reduce((sum, t) => sum + t.admin_fee, 0);
  const netBalance = totalDeposits - totalWithdrawals;

  // Count users by package
  const packageCounts = packages.reduce((acc, pkg) => {
    acc[pkg.id] = users.filter(u => u.package_id === pkg.id).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600">Manage deposits, withdrawals, and verifications</p>
        </div>
      </div>

      {/* Package Upgrade Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Package Upgrade Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-700">{pkg.name}</div>
              <div className="text-2xl font-bold text-blue-900">{packageCounts[pkg.id] || 0}</div>
              <div className="text-xs text-gray-500 mt-1">users</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Pending Verifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Verifications</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingTransactions.length}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        {/* Total Deposits */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">₹{totalDeposits.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-green-500" />
          </div>
        </div>
        {/* Total Withdrawals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-600">₹{totalWithdrawals.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-red-500" />
          </div>
        </div>
        {/* Net Balance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Balance</p>
              <p className="text-2xl font-bold text-blue-600">₹{netBalance.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        {/* Total Fees */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Fees</p>
              <p className="text-2xl font-bold text-purple-600">₹{totalFees.toFixed(2)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-purple-500" />
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
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <div className="mb-4">
              <button
                className={`px-4 py-2 rounded-lg mr-2 ${showPendingDeposits ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                onClick={() => setShowPendingDeposits((v) => !v)}
              >
                {showPendingDeposits ? 'Show All Transactions' : 'Show Pending Deposits Only'}
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TX Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const user = getUserById(transaction.user_id);
                const isWithdrawal = transaction.type === 'withdrawal';
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {user?.name.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user?.name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">{user?.email || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'deposit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{transaction.amount.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Fee: ₹{transaction.admin_fee.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(transaction.status)}
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {transaction.tx_hash ? (
                        <span className="text-xs text-gray-500 font-mono">
                          {transaction.tx_hash.substring(0, 10)}...
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Only show approve/reject for pending deposits, not withdrawals */}
                        {!isWithdrawal && transaction.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleTransactionAction(transaction, 'approve')}
                              className="text-green-600 hover:text-green-800"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleTransactionAction(transaction, 'reject')}
                              className="text-red-600 hover:text-red-800"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Transaction Details</h3>
            </div>
            
            <div className="p-6">
              {/* DEBUG: Show type and status */}
              <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                <strong>DEBUG:</strong> type = {selectedTransaction.type}, status = {selectedTransaction.status}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedTransaction.id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedTransaction.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Fee</label>
                  <p className="mt-1 text-sm text-gray-900">₹{selectedTransaction.admin_fee.toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Net Amount</label>
                  <p className="mt-1 text-sm text-gray-900">
                    ₹{(selectedTransaction.amount - selectedTransaction.admin_fee).toFixed(2)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{selectedTransaction.status}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedTransaction.date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getUserById(selectedTransaction.user_id)?.name || 'Unknown'}
                  </p>
                </div>
                {selectedTransaction.type === 'withdrawal' && selectedTransaction.status === 'pending' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Transaction Hash (required for verification)</label>
                    <input
                      type="text"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                      value={txHashInput}
                      onChange={e => setTxHashInput(e.target.value)}
                      placeholder="Enter transaction hash"
                    />
                  </div>
                )}
                {selectedTransaction.tx_hash && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Transaction Hash</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {selectedTransaction.tx_hash}
                    </p>
                  </div>
                )}
                {selectedTransaction.wallet_address && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Wallet Address</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {selectedTransaction.wallet_address}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="flex space-x-3">
                {selectedTransaction.status === 'pending' && selectedTransaction.type === 'withdrawal' ? (
                  <button
                    onClick={handleWithdrawalVerify}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    disabled={!txHashInput.trim()}
                  >
                    Verify & Save Hash
                  </button>
                ) : selectedTransaction.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => handleTransactionAction(selectedTransaction, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleTransactionAction(selectedTransaction, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                ) : null}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactions;