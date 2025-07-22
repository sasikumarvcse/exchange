import { Check, Crown, Loader2, Package, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Package as PackageType, User } from '../types';
import { supabase } from '../lib/supabase';
import { setCurrentUser, getCurrentUser } from '../utils/auth';
import { getAllPackages, updateUser, createTransaction } from '../utils/database';

interface PackageWithFallback extends PackageType {
  price: number;
  roi: number;
  benefits: string[];
}

const Packages: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [packages, setPackages] = useState<PackageWithFallback[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PackageWithFallback | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState({
    page: true,
    activation: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(prev => ({ ...prev, page: true }));
        setError(null);
        
        const currentUser = getCurrentUser();
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        // Fetch the latest user profile from the database
        const { data: freshUser } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        if (!freshUser) throw new Error('User not found');
        setCurrentUser(freshUser);
        setUser(freshUser);
        const availablePackages = await getAllPackages();
        
        setPackages(availablePackages.map(pkg => ({
          ...pkg,
          price: pkg.price || 0,
          roi: pkg.roi || 0,
          benefits: pkg.benefits || []
        })));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load packages');
      } finally {
        setLoading(prev => ({ ...prev, page: false }));
      }
    };

    loadData();
  }, []);

  const handlePackageSelect = (pkg: PackageWithFallback) => {
    // Check if user can activate this package (must be higher price than current)
    if (user?.package_id) {
      const currentPackage = packages.find(p => p.id === user.package_id);
      if (currentPackage && pkg.price <= currentPackage.price) {
        setError('You can only upgrade to a higher-priced package. Please select a more expensive package.');
        return;
      }
    }
    
    setSelectedPackage(pkg);
    setShowConfirmation(true);
    setError(null);
  };

  const handlePackageActivation = async () => {
    console.log('handlePackageActivation called', { user, selectedPackage });
    if (!user || !selectedPackage) {
      console.warn('Activation aborted: user or selectedPackage is null', { user, selectedPackage });
      return;
    }

    try {
      setLoading(prev => ({ ...prev, activation: true }));
      setError(null);

      const userBalance = user.wallet_balance || 0;
      const packagePrice = selectedPackage.price || 0;
      console.log('User balance:', userBalance, 'Package price:', packagePrice);

      // Sequential upgrade enforcement: only allow upgrade to the next package in price order
      const sortedPackages = [...packages].sort((a, b) => a.price - b.price);
      const currentIndex = user.package_id ? sortedPackages.findIndex(p => p.id === user.package_id) : -1;
      const nextIndex = currentIndex + 1;
      if (nextIndex >= sortedPackages.length || sortedPackages[nextIndex].id !== selectedPackage.id) {
        setError('You can only upgrade to the next package in sequence.');
        console.warn('Activation aborted: not next package in sequence', { currentIndex, nextIndex, selectedPackage });
        return;
      }

      if (userBalance < packagePrice) {
        setError('Insufficient balance! Please deposit GPK Coin first.');
        console.warn('Activation aborted: insufficient balance', { userBalance, packagePrice });
        return;
      }

      // Debug: Print Supabase Auth UID and profile ID
      const { data: authUser } = await supabase.auth.getUser();
      console.log('Supabase Auth UID:', authUser?.user?.id, 'Profile ID:', user.id);

      // Use correct column names for update
      const updatedUser = await updateUser(user.id, {
        package_id: String(selectedPackage.id),
        is_active: true,
        wallet_balance: userBalance - packagePrice
      });

      if (updatedUser) {
        // Log the upgrade transaction
        try {
          const txResult = await createTransaction({
            user_id: user.id,
            type: 'upgrade',
            amount: packagePrice,
            tx_hash: null,
            wallet_address: null,
            status: 'verified',
            admin_fee: 0,
            reference_id: selectedPackage.id,
            date: new Date().toISOString(),
            description: `Package Upgrade: ${selectedPackage.name}`
          });
          if (!txResult) {
            console.error('Failed to insert upgrade transaction: No result returned');
            setError('Upgrade successful, but failed to log transaction. Please contact support.');
          }
        } catch (txError: any) {
          // Log the full error details for debugging
          if (txError && txError.message) {
            console.error('Error inserting upgrade transaction:', txError.message, txError.details || '', txError.hint || '', txError.code || '');
          } else {
            console.error('Error inserting upgrade transaction:', txError);
          }
          setError('Upgrade successful, but failed to log transaction. Please contact support.');
        }
        setUser(updatedUser);
        setShowConfirmation(false);
        setSelectedPackage(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate package');
    } finally {
      setLoading(prev => ({ ...prev, activation: false }));
    }
  };

  const getPackageIcon = (packageName: string) => {
    switch (packageName.toLowerCase()) {
      case 'starter': return <Package className="h-8 w-8" />;
      case 'silver': return <Star className="h-8 w-8" />;
      case 'gold': return <Crown className="h-8 w-8" />;
      case 'platinum': return <Crown className="h-8 w-8 text-purple-500" />;
      case 'diamond': return <Crown className="h-8 w-8 text-blue-500" />;
      default: return <Package className="h-8 w-8" />;
    }
  };

  const getPackageGradient = (packageName: string) => {
    switch (packageName.toLowerCase()) {
      case 'starter': return 'from-blue-500 to-blue-600';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-purple-500 to-purple-700';
      case 'diamond': return 'from-blue-500 to-blue-700';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  const formatNumber = (value: number | undefined, decimals = 2) => {
    return (value || 0).toFixed(decimals);
  };

  // Helper function to get current user's package price
  const getCurrentPackagePrice = () => {
    if (!user?.package_id) return 0;
    return packages.find(p => p.id === user.package_id)?.price || 0;
  };

  // Helper function to check if package can be activated
  const canActivatePackage = (packagePrice: number) => {
    const userBalance = user?.wallet_balance || 0;
    const currentPackagePrice = getCurrentPackagePrice();
    
    return userBalance >= packagePrice && (currentPackagePrice === 0 || packagePrice > currentPackagePrice);
  };

  // Helper function to get package status
  const getPackageStatus = (pkg: PackageWithFallback) => {
    if (user?.package_id === pkg.id) {
      return 'active';
    }
    if (!canActivatePackage(pkg.price)) {
      if ((user?.wallet_balance || 0) < pkg.price) {
        return 'insufficient_balance';
      }
      if (getCurrentPackagePrice() >= pkg.price) {
        return 'upgrade_required';
      }
    }
    return 'available';
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
        {error}
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg">
        User not found. Please login again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Choose Your Package</h1>
        <p className="mt-2 text-gray-600">Select the perfect package to start your MLM journey</p>
        <div className="mt-4 inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg">
          <span className="font-medium">Current Balance:</span>
          <span className="font-bold">{formatNumber(user.wallet_balance)} GPK</span>
        </div>

        {/* Package Progression Status */}
        {user.package_id && (
          <div className="mt-4">
            {(() => {
              const currentPackage = packages.find(p => p.id === user.package_id);
              const nextPackage = packages.find(p => p.price > getCurrentPackagePrice());
              
              return (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-2">
            <Check className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">
                      Current: {currentPackage?.name || 'Unknown Package'}
            </span>
          </div>
                  {nextPackage && (
                    <div className="text-sm text-green-700">
                      Next upgrade available: {nextPackage.name} ({formatNumber(nextPackage.price)} GPK)
        </div>
      )}
                </div>
              );
            })()}
          </div>
        )}
      </div>



      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg, index) => {
          let status = '';
          const sortedPackages = [...packages].sort((a, b) => a.price - b.price);
          const currentIndex = user?.package_id ? sortedPackages.findIndex(p => p.id === user.package_id) : -1;
          const sortedIndex = sortedPackages.findIndex(p => p.id === pkg.id);
          if (user?.package_id === pkg.id) {
            status = 'active';
          } else if (sortedIndex === currentIndex - 1) {
            status = 'upgrade_completed';
          } else if (sortedIndex === currentIndex + 1) {
            status = 'next_upgrade';
          }
          
          return (
          <div
            key={pkg.id}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl relative ${
                status === 'active'
                ? 'border-green-500 bg-green-50' 
                  : status === 'next_upgrade'
                  ? 'border-blue-500 bg-blue-50'
                  : status === 'upgrade_completed'
                  ? 'border-gray-400 bg-gray-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
              {/* Progression indicator */}
              {status === 'next_upgrade' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Next Upgrade
                </div>
              )}
              {status === 'upgrade_completed' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-400 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Upgrade Completed
                </div>
              )}
              
            <div className={`bg-gradient-to-r ${getPackageGradient(pkg.name)} p-6 rounded-t-xl text-white`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{pkg.name}</h3>
                  <p className="text-white/90">Package</p>
                </div>
                {getPackageIcon(pkg.name)}
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold">{formatNumber(pkg.price)} GPK</div>
                <div className="text-white/90">ROI: {formatNumber(pkg.roi)}%</div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-600 text-sm">{pkg.description || 'No description available'}</p>
              </div>
              
              <div className="space-y-2 mb-6">
                <h4 className="font-semibold text-gray-900">Benefits:</h4>
                <ul className="space-y-1">
                  {pkg.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                  {status === 'active' ? (
                  <div className="flex items-center justify-center py-2 px-4 bg-green-100 text-green-800 rounded-lg">
                    <Check className="h-4 w-4 mr-2" />
                    <span className="font-medium">Active Package</span>
                  </div>
                ) : status === 'upgrade_completed' ? (
                  <div className="flex items-center justify-center py-2 px-4 bg-gray-100 text-gray-700 rounded-lg">
                    <Check className="h-4 w-4 mr-2" />
                    <span className="font-medium">Upgrade Completed</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handlePackageSelect(pkg)}
                      disabled={!canActivatePackage(pkg.price) || status !== 'next_upgrade'}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        canActivatePackage(pkg.price) && status === 'next_upgrade'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                      {status === 'insufficient_balance' && 'Insufficient Balance'}
                      {status === 'upgrade_required' && 'Upgrade Required'}
                      {status === 'next_upgrade' && (user?.package_id ? 'Upgrade Package' : 'Activate Package')}
                  </button>
                )}
                
                <div className="text-center">
                  <span className="text-xs text-gray-500">
                    Estimated ROI: ${formatNumber((pkg.price || 0) * (pkg.roi || 0) / 100)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && selectedPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Package Activation</h3>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Package:</span>
                <span className="font-medium">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium">{formatNumber(selectedPackage.price)} GPK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Balance:</span>
                <span className="font-medium">{formatNumber(user.wallet_balance)} GPK</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Balance After:</span>
                <span className="font-medium">
                  {formatNumber((user.wallet_balance || 0) - (selectedPackage.price || 0))} GPK
                </span>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setError(null);
                }}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={loading.activation}
              >
                Cancel
              </button>
              <button
                onClick={handlePackageActivation}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                disabled={loading.activation}
              >
                {loading.activation ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Comparison */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Package Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4 text-sm font-medium text-gray-600">Feature</th>
                {packages.map((pkg) => (
                  <th key={pkg.id} className="text-center py-2 px-4 text-sm font-medium text-gray-600">
                    {pkg.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm text-gray-900">Price (GPK)</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="py-3 px-4 text-sm text-center font-medium">
                    {formatNumber(pkg.price)}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm text-gray-900">ROI (%)</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="py-3 px-4 text-sm text-center font-medium">
                    {formatNumber(pkg.roi)}%
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="py-3 px-4 text-sm text-gray-900">Direct Referral</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="py-3 px-4 text-sm text-center">
                    <Check className="h-4 w-4 text-green-500 mx-auto" />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Packages;