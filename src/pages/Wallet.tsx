import { AlertTriangle, CheckCircle, Clock, Copy, Loader2, Minus, Plus, RefreshCw, Wallet as WalletIcon, XCircle, ArrowUpRight, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import DepositForm from '../components/Wallet/DepositForm';
import { supabase } from '../lib/supabase';
import { Transaction, User } from '../types';
import { getCurrentUser, setCurrentUser } from '../utils/auth';
import { getAdminConfig, getUserTransactions } from '../utils/database';
import toast from 'react-hot-toast';
import Header from '../components/Layout/Header';

interface WalletState {
  user: User | null;
  transactions: Transaction[];
  adminConfig: {
    minimumWithdrawal: number;  
    withdrawalFeePercent: number;
    depositFeePercent: number;
    gpkToInrPrice: number; // Added for INR price
  };
}

const NOTIF_KEY = 'user_notifications';

// Utility to fetch and update the latest user profile
const fetchAndUpdateCurrentUser = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (data) {
    setCurrentUser(data);
    return data;
  }
  return null;
};

const Wallet: React.FC = () => {
  const [state, setState] = useState<WalletState>({
    user: null,
    transactions: [],
    adminConfig: {
      minimumWithdrawal: 100,
      withdrawalFeePercent: 5,
      depositFeePercent: 0,
      gpkToInrPrice: 100 // Default value
    }
  });
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [loading, setLoading] = useState<{ page: boolean; withdrawal: boolean; transactions: boolean }>({
    page: true,
    withdrawal: false,
    transactions: false
  });
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(NOTIF_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        setLoading((prev: typeof loading) => ({ ...prev, page: true, transactions: true }));
        setError(null);
        
        // Always fetch the latest user profile from the database
        const currentUser = getCurrentUser();
        if (!currentUser) throw new Error('User not authenticated');
        const { data: freshUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (!freshUser) throw new Error('User not found');
        setCurrentUser(freshUser);

        // Load data in parallel
        const [config, userTransactions] = await Promise.all([
          getAdminConfig(),
          getUserTransactions(currentUser.id)
        ]);

        setState({
          user: freshUser,
          transactions: userTransactions || [],
          adminConfig: config || {
            minimumWithdrawal: 100,
            withdrawalFeePercent: 5,
            depositFeePercent: 0,
            gpkToInrPrice: 100 // Default value
          }
        });
      } catch (err) {
        setError((err as Error).message || 'Failed to load wallet data');
        console.error('Wallet load error:', err);
      } finally {
        setLoading((prev: typeof loading) => ({ ...prev, page: false, transactions: false }));
      }
    };

    loadWalletData();

    // --- Realtime subscription for deposit notifications ---
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const channel = supabase.channel('user-deposit-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${currentUser.id}`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new.type === 'deposit' && payload.new.status === 'pending') {
            setNotifications((prev) => [
              ...prev,
              { id: payload.new.id, message: 'Deposit request sent successfully!', read: false, date: new Date().toISOString() }
            ]);
            toast.success('Deposit request sent successfully!');
            refreshTransactions();
          }
          if (payload.eventType === 'UPDATE' && payload.new.type === 'deposit' && payload.old.status === 'pending' && payload.new.status === 'verified') {
            setNotifications((prev) => [
              ...prev,
              { id: payload.new.id, message: `Deposit of ${payload.new.amount} GPK verified and credited!`, read: false, date: new Date().toISOString() }
            ]);
            toast.success(`Deposit of ${payload.new.amount} GPK verified and credited!`);
            refreshTransactions();
            // Fetch and update the latest user profile
            const updatedUser = await fetchAndUpdateCurrentUser(currentUser.id);
            if (updatedUser) {
              setState(prev => ({ ...prev, user: updatedUser }));
            }
          }
          // Also handle withdrawal completion/verification
          if (payload.eventType === 'UPDATE' && payload.new.type === 'withdrawal' && ['completed', 'verified'].includes(payload.new.status) && payload.old.status !== payload.new.status) {
            // Fetch and update the latest user profile
            const updatedUser = await fetchAndUpdateCurrentUser(currentUser.id);
            if (updatedUser) {
              setState(prev => ({ ...prev, user: updatedUser }));
            }
          }
        }
      );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleWithdraw = async () => {
    if (!state.user || !withdrawAmount) return;

    try {
      setLoading(prev => ({ ...prev, withdrawal: true }));
      setError(null);

      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

      const { minimumWithdrawal, withdrawalFeePercent } = state.adminConfig;

      if (amount < minimumWithdrawal) {
        throw new Error(`Minimum withdrawal is ${minimumWithdrawal} GPK`);
      }

      if (amount > (state.user.wallet_balance || 0)) {
        throw new Error('Insufficient balance');
      }

      if (!state.user.wallet_address) {
        throw new Error('Set wallet address in profile first');
      }

      if (!state.user.transaction_password || state.user.transaction_password !== transactionPassword) {
        throw new Error('Invalid transaction password');
      }

      const adminFee = amount * (withdrawalFeePercent / 100);
      const netAmount = amount - adminFee;

      // Start transaction
      const { data: newTransaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: state.user.id,
          type: 'withdrawal',
          amount,
          admin_fee: adminFee,
          net_amount: netAmount,
          wallet_address: state.user.wallet_address,
          status: 'pending'
        }])
        .select();

      if (txError || !newTransaction) {
        console.error('Withdrawal error:', txError);
        throw txError || new Error('Failed to create transaction');
      }

      // Update local state (no need to update balance here, will be handled by trigger and realtime)
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setTransactionPassword('');
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(prev => ({ ...prev, withdrawal: false }));
    }
  };

  const refreshTransactions = async () => {
    if (!state.user) return;

    try {
      setLoading((prev: { page: boolean; withdrawal: boolean; transactions: boolean }) => ({ ...prev, transactions: true }));
      setError(null);
      
      const userTransactions = await getUserTransactions(state.user.id);
      setState((prev: WalletState) => ({ ...prev, transactions: userTransactions || [] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh transactions');
    } finally {
      setLoading((prev: { page: boolean; withdrawal: boolean; transactions: boolean }) => ({ ...prev, transactions: false }));
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

  const formatGPK = (n: number): string => (n || 0).toFixed(2);

  // Pass notifications and a mark-as-read handler to Header
  const handleMarkNotificationsRead = () => {
    setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  };

  if (loading.page) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <p className="font-medium">{error}</p>
            {error.includes('configuration') && (
              <p className="text-sm mt-1">Using default system settings</p>
            )}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!state.user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        Wallet data not available. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 rounded-xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">GPK Wallet</h1>
            <p className="text-blue-100">Secure GPK Coin Management</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <WalletIcon className="h-8 w-8 text-white" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-sm text-blue-100 mb-1">Available Balance</div>
            <div className="text-4xl font-bold">{formatGPK(state.user.wallet_balance)} GPK</div>
            <div className="text-sm text-blue-200 mt-2">≈ ₹{((state.user.wallet_balance || 0) * state.adminConfig.gpkToInrPrice).toFixed(2)} INR</div>
          </div>
          <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-sm text-blue-100 mb-1">Total Earnings</div>
            <div className="text-4xl font-bold">{formatGPK(state.user.total_earnings)} GPK</div>
            <div className="text-sm text-blue-200 mt-2">Lifetime income</div>
          </div>
        </div>
      </div>

      {/* Wallet Address Warning */}
      {!state.user.wallet_address && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-yellow-800 font-medium">Wallet Address Required</p>
              <p className="text-yellow-700 text-sm mt-1">
                Please add your GPK Coin wallet address in your profile to enable withdrawals.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowDepositModal(true)}
          className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Plus className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Deposit GPK</div>
              <div className="text-green-100 text-sm">Add funds to your wallet</div>
            </div>
          </div>
          <div className="absolute inset-0 bg-white/10 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200"></div>
        </button>
        
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!state.user.wallet_address || (state.user.wallet_balance || 0) < state.adminConfig.minimumWithdrawal}
          className="group relative overflow-hidden bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Minus className="h-6 w-6" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold">Withdraw GPK</div>
              <div className="text-red-100 text-sm">Send to your wallet</div>
            </div>
          </div>
          {!state.user.wallet_address && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-xs">Setup wallet address first</span>
            </div>
          )}
          {(state.user.wallet_balance || 0) < state.adminConfig.minimumWithdrawal && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="text-xs">Min. {state.adminConfig.minimumWithdrawal} GPK required</span>
            </div>
          )}
        </button>
      </div>

      {/* Fee Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {state.adminConfig.depositFeePercent}%
            </div>
            <div className="text-sm text-blue-700">Deposit Fee</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {state.adminConfig.withdrawalFeePercent}%
            </div>
            <div className="text-sm text-red-700">Withdrawal Fee</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {formatGPK(state.adminConfig.minimumWithdrawal)}
            </div>
            <div className="text-sm text-green-700">Min. Withdrawal</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              ₹{state.adminConfig.gpkToInrPrice || 100}
            </div>
            <div className="text-sm text-yellow-700">GPK Price (INR)</div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <button
              onClick={refreshTransactions}
              disabled={loading.transactions}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              {loading.transactions ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Refresh
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {state.transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {transaction.type === 'deposit' ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Plus className="h-4 w-4 text-green-600" />
                        </div>
                      ) : transaction.type === 'upgrade' ? (
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <ArrowUpRight className="h-4 w-4 text-blue-600" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <Minus className="h-4 w-4 text-red-600" />
                        </div>
                      )}
                      <span className="capitalize font-medium text-gray-900">
                        {transaction.type === 'upgrade' ? 'Upgrade' : transaction.type}
                      </span>
                    </div>
                    {transaction.type === 'upgrade' && (
                      <div className="text-xs text-blue-500 font-medium mt-1">{transaction.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatGPK(transaction.amount)} GPK
                      </div>
                      <div className="text-xs text-gray-500">
                        Fee: {formatGPK(transaction.admin_fee)} GPK
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{transaction.date ? new Date(transaction.date).toLocaleDateString() : '-'}</div>
                      <div className="text-xs text-gray-500">
                        {transaction.date ? new Date(transaction.date).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {transaction.tx_hash ? (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500 font-mono">
                          {transaction.tx_hash.substring(0, 8)}...{transaction.tx_hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(transaction.tx_hash || '')}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {state.transactions.length === 0 && (
            <div className="text-center py-12">
              <WalletIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No transactions yet</h3>
              <p className="mt-2 text-gray-500">
                Your wallet transactions will appear here once you make a deposit or withdrawal.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Deposit GPK Coin</h3>
            </div>
            
            <div className="p-6">
              <DepositForm
                onSuccess={() => {
                  setShowDepositModal(false);
                  refreshTransactions();
                }}
                onCancel={() => setShowDepositModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Withdraw GPK Coin</h3>
            </div>
            
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
                    {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Amount (GPK)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter amount"
                  min={state.adminConfig.minimumWithdrawal}
                  max={state.user?.wallet_balance}
                  step="0.01"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Min: {formatGPK(state.adminConfig.minimumWithdrawal)} GPK | Available: {formatGPK(state.user?.wallet_balance)} GPK
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Address
                </label>
                <input
                  type="text"
                  value={state.user?.wallet_address || ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Password
                </label>
                <input
                  type="password"
                  value={transactionPassword}
                  onChange={(e) => setTransactionPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your transaction password"
                />
              </div>
              
              {withdrawAmount && parseFloat(withdrawAmount) >= state.adminConfig.minimumWithdrawal && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Withdrawal Amount:</span>
                    <span className="font-medium">{formatGPK(parseFloat(withdrawAmount))} GPK</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Admin Fee ({state.adminConfig.withdrawalFeePercent}%):</span>
                    <span className="font-medium text-red-600">
                      {formatGPK(parseFloat(withdrawAmount) * state.adminConfig.withdrawalFeePercent / 100)} GPK
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>You'll Receive:</span>
                      <span className="text-green-600">
                        {formatGPK(parseFloat(withdrawAmount) * (1 - state.adminConfig.withdrawalFeePercent / 100))} GPK
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowWithdrawModal(false);
                    setError(null);
                  }}
                  className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel  
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount || 
                    !transactionPassword || 
                    loading.withdrawal || 
                    parseFloat(withdrawAmount) < state.adminConfig.minimumWithdrawal
                  }
                  className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading.withdrawal ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;