import React, { useState, useEffect } from 'react';
import { Shield, Check, Crown, Diamond, Star, Package, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';
import { MLMService } from '../lib/supabase';
import { Package, User, UserPackage, PackageUpgradeCheck } from '../types';
import toast from 'react-hot-toast';

interface PackagesProps {
  user: User;
}

const packageIcons = {
  starter: Package,
  silver: Shield,
  gold: Crown,
  platinum: Star,
  diamond: Diamond
};

const packageColors = {
  starter: 'from-green-500 to-green-600',
  silver: 'from-gray-400 to-gray-500',
  gold: 'from-yellow-400 to-yellow-500',
  platinum: 'from-blue-500 to-blue-600',
  diamond: 'from-purple-500 to-purple-600'
};

const packageBorders = {
  starter: 'border-green-500',
  silver: 'border-gray-400',
  gold: 'border-yellow-400',
  platinum: 'border-blue-500',
  diamond: 'border-purple-500'
};

export default function Packages({ user }: PackagesProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPackage, setPurchasingPackage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesData, userPackagesData] = await Promise.all([
        MLMService.getPackages(),
        MLMService.getUserPackages(user.id)
      ]);
      setPackages(packagesData);
      setUserPackages(userPackagesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const checkUpgradeEligibility = async (packageId: string): Promise<PackageUpgradeCheck> => {
    try {
      return await MLMService.canUpgradeToPackage(user.id, packageId);
    } catch (error) {
      console.error('Error checking upgrade eligibility:', error);
      return { canUpgrade: false, reason: 'Error checking eligibility' };
    }
  };

  const handlePurchase = async (pkg: Package) => {
    const eligibility = await checkUpgradeEligibility(pkg.id);
    
    if (!eligibility.canUpgrade) {
      toast.error(eligibility.reason || 'Cannot upgrade to this package');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to purchase ${pkg.name} package for ₹${pkg.price.toLocaleString()}?`
    );

    if (!confirmed) return;

    setPurchasingPackage(pkg.id);
    
    try {
      await MLMService.purchasePackage(user.id, pkg.id, pkg.price);
      toast.success(`Successfully purchased ${pkg.name} package!`);
      await loadData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Error purchasing package:', error);
      toast.error('Failed to purchase package');
    } finally {
      setPurchasingPackage(null);
    }
  };

  const hasPackage = (packageId: string) => {
    return userPackages.some(up => up.package_id === packageId);
  };

  const getPackageStatus = (pkg: Package) => {
    if (hasPackage(pkg.id)) {
      return { status: 'owned', text: 'Purchased', icon: CheckCircle2, color: 'text-green-600' };
    }
    
    // Check if this is the next package in sequence
    const packageOrder = ['starter', 'silver', 'gold', 'platinum', 'diamond'];
    const currentIndex = packageOrder.indexOf(pkg.id);
    
    if (currentIndex === 0) {
      return { status: 'available', text: 'Purchase', icon: ArrowRight, color: 'text-blue-600' };
    }
    
    const previousPackageId = packageOrder[currentIndex - 1];
    const hasPreviousPackage = hasPackage(previousPackageId);
    
    if (hasPreviousPackage) {
      return { status: 'available', text: 'Upgrade', icon: ArrowRight, color: 'text-blue-600' };
    }
    
    return { status: 'locked', text: 'Locked', icon: Lock, color: 'text-gray-400' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading packages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">GrowwPark MLM Packages</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your investment package and start your journey with GrowwPark. 
            Upgrade step-by-step to unlock higher income potential and global royalty benefits.
          </p>
        </div>

        {/* Package Rules */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Package Purchase Rules</h3>
          <ul className="list-disc list-inside space-y-2 text-blue-800">
            <li>All users must start with the <strong>Starter</strong> package (₹2,500)</li>
            <li>Upgrade path: Starter → Silver → Gold → Platinum → Diamond</li>
            <li>You cannot skip packages - each upgrade must be sequential</li>
            <li>Only Silver+ packages are eligible for Global Royalty (15% pool every 90 days)</li>
          </ul>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {packages.map((pkg) => {
            const IconComponent = packageIcons[pkg.id as keyof typeof packageIcons] || Package;
            const status = getPackageStatus(pkg);
            const isOwned = status.status === 'owned';
            const isLocked = status.status === 'locked';
            const isPurchasing = purchasingPackage === pkg.id;

            return (
              <div
                key={pkg.id}
                className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                  isOwned ? 'ring-2 ring-green-500' : ''
                } ${isLocked ? 'opacity-75' : ''}`}
              >
                {/* Package Header */}
                <div className={`bg-gradient-to-r ${packageColors[pkg.id as keyof typeof packageColors]} text-white p-6 rounded-t-2xl relative overflow-hidden`}>
                  {isOwned && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="text-center">
                    <IconComponent className="w-12 h-12 mx-auto mb-2" />
                    <h3 className="text-xl font-bold capitalize">{pkg.name}</h3>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(pkg.price)}</p>
                  </div>
                </div>

                {/* Package Body */}
                <div className="p-6">
                  {/* Global Royalty Badge */}
                  {pkg.global_royalty_eligible && (
                    <div className="mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        🌍 {pkg.global_royalty_share_percent}% Global Royalty
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {pkg.description && (
                    <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  )}

                  {/* Benefits */}
                  <div className="space-y-2 mb-6">
                    {pkg.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handlePurchase(pkg)}
                    disabled={isOwned || isLocked || isPurchasing}
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                      isOwned
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : isLocked
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg'
                    }`}
                  >
                    {isPurchasing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <status.icon className="w-4 h-4" />
                        <span>{status.text}</span>
                      </>
                    )}
                  </button>

                  {/* Additional Info for Locked Packages */}
                  {isLocked && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Complete previous packages to unlock
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Income Plan Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Direct Referral Income */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Direct Referral</h3>
              <p className="text-3xl font-bold text-green-600">25%</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• One-time income on first package purchase</li>
              <li>• 25% of package amount</li>
              <li>• Only from direct referrals</li>
              <li>• Instant credit to wallet</li>
            </ul>
          </div>

          {/* Level Income */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Level Income</h3>
              <p className="text-3xl font-bold text-blue-600">Up to 15%</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Levels 1-7: 1% each</li>
              <li>• Level 8: 2%</li>
              <li>• Levels 9-10: 3% each</li>
              <li>• Qualification required for each level</li>
            </ul>
          </div>

          {/* Global Royalty */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Global Royalty</h3>
              <p className="text-3xl font-bold text-purple-600">15%</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 15% of total system sales</li>
              <li>• Distributed every 90 days</li>
              <li>• Only Silver+ packages eligible</li>
              <li>• Share based on package level</li>
            </ul>
          </div>
        </div>

        {/* Current Status */}
        {userPackages.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Current Packages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userPackages.map((userPkg) => (
                <div key={userPkg.id} className={`border-2 ${packageBorders[userPkg.package_id as keyof typeof packageBorders]} rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold capitalize">{userPkg.package_id}</h4>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Purchased: {new Date(userPkg.purchase_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: {formatCurrency(userPkg.amount_paid)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}