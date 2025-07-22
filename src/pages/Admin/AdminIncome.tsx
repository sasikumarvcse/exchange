import { DollarSign, Save, Settings, TrendingUp, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AdminConfig } from '../../types';
import { getAdminConfig, updateAdminConfig } from '../../utils/database';

const AdminIncome: React.FC = () => {
  const [config, setConfig] = useState<AdminConfig>({
    depositWalletAddress: '',
    directReferralPercent: 10,
    levelIncomePercent: [], // Add default empty array
    binaryIncomePercent: 0, // Add default value
    globalRoyaltyPercent: 2,
    depositFeePercent: 2,
    withdrawalFeePercent: 5,
    minimumWithdrawal: 50,
    minimumDeposit: 10,
    gpkToInrPrice: 100 // Added missing field
  });

  const [tempLevelPercents, setTempLevelPercents] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    const fetchConfig = async () => {
      try {
        const adminConfig = await getAdminConfig();
        if (adminConfig) {
          setConfig(adminConfig);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    fetchConfig();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: name.includes('Percent') || name.includes('minimum') ? parseFloat(value) || 0 : value
    }));
  };

  const handleLevelPercentChange = (index: number, value: string) => {
    const newPercents = [...tempLevelPercents];
    newPercents[index] = value;
    setTempLevelPercents(newPercents);
    
    const updatedConfig = { ...config };
    updatedConfig.levelIncomePercent[index] = parseFloat(value) || 0;
    setConfig(updatedConfig);
  };

  const addLevel = () => {
    setTempLevelPercents([...tempLevelPercents, '0']);
    setConfig(prev => ({
      ...prev,
      levelIncomePercent: [...prev.levelIncomePercent, 0]
    }));
  };

  const removeLevel = (index: number) => {
    if (tempLevelPercents.length > 1) {
      const newPercents = tempLevelPercents.filter((_, i) => i !== index);
      setTempLevelPercents(newPercents);
      setConfig(prev => ({
        ...prev,
        levelIncomePercent: prev.levelIncomePercent.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = () => {
    const saveConfig = async () => {
      try {
        await updateAdminConfig(config);
        setMessage('Configuration saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error saving config:', error);
        setMessage('Error saving configuration. Please try again.');
        setTimeout(() => setMessage(''), 3000);
      }
    };
    saveConfig();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-600">Configure income percentages and fee structures</p>
        </div>
        <button
          onClick={handleSave}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Save Configuration</span>
        </button>
      </div>

      {/* Success Message */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
            <p className="text-green-800">{message}</p>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Direct Referral</p>
              <p className="text-2xl font-bold text-blue-600">{config.directReferralPercent}%</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Global Royalty</p>
              <p className="text-2xl font-bold text-purple-600">{config.globalRoyaltyPercent}%</p>
            </div>
            <TrendingUp className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Configuration Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wallet Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deposit Wallet Address
              </label>
              <input
                type="text"
                name="depositWalletAddress"
                value={config.depositWalletAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter GPK Coin wallet address"
              />
              <p className="text-xs text-gray-500 mt-1">
                This address will receive all user deposits
              </p>
            </div>
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fee Configuration</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deposit Fee (%)
                </label>
                <input
                  type="number"
                  name="depositFeePercent"
                  value={config.depositFeePercent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Withdrawal Fee (%)
                </label>
                <input
                  type="number"
                  name="withdrawalFeePercent"
                  value={config.withdrawalFeePercent}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Deposit (GPK)
                </label>
                <input
                  type="number"
                  name="minimumDeposit"
                  value={config.minimumDeposit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Withdrawal (GPK)
                </label>
                <input
                  type="number"
                  name="minimumWithdrawal"
                  value={config.minimumWithdrawal}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Income Percentages */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Income Percentages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direct Referral Income (%)
            </label>
            <input
              type="number"
              name="directReferralPercent"
              value={config.directReferralPercent}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of direct referral package price
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Global Royalty (%)
            </label>
            <input
              type="number"
              name="globalRoyaltyPercent"
              value={config.globalRoyaltyPercent}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage from global pool
            </p>
          </div>
        </div>
      </div>

      {/* Level Income Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Level Income Configuration</h3>
          <button
            onClick={addLevel}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            + Add Level
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tempLevelPercents.map((percent, index) => (
            <div key={index} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Level {index + 1} (%)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={percent}
                  onChange={(e) => handleLevelPercentChange(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  max="100"
                  step="0.1"
                />
                {tempLevelPercents.length > 1 && (
                  <button
                    onClick={() => removeLevel(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            <strong>Total Level Income:</strong> {(Array.isArray(config.levelIncomePercent) ? config.levelIncomePercent : []).reduce((sum, p) => sum + p, 0).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Example: ₹1000 Package Purchase</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Direct Referral Income:</span>
                <span className="font-medium">₹{(1000 * config.directReferralPercent / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Global Royalty:</span>
                <span className="font-medium">₹{(1000 * config.globalRoyaltyPercent / 100).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminIncome;