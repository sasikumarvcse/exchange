import { Database, Globe, Loader, Lock, Mail, Save, Settings, Shield, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AdminConfig } from '../../types';
import { getAdminConfig, getAllAdminUsers, updateAdminConfig, updateAdminPassword } from '../../utils/database';

const defaultAdminConfig: AdminConfig = {
  depositWalletAddress: '',
  directReferralPercent: 10,
  levelIncomePercent: [5, 3, 2, 1, 1],
  binaryIncomePercent: 8,
  globalRoyaltyPercent: 2,
  depositFeePercent: 2,
  withdrawalFeePercent: 5,
  minimumWithdrawal: 50,
  minimumDeposit: 10,
  gpkToInrPrice: 100
};

const defaultSystemSettings = {
  siteName: 'GrowwPark MLM',
  siteDescription: 'Advanced MLM Platform with GPK Coin Integration',
  contactEmail: 'support@growwpark.com',
  supportPhone: '+1234567890',
  maintenanceMode: false,
  autoApproveDeposits: false,
  emailNotifications: true,
  smsNotifications: false,
  twoFactorAuth: false,
  sessionTimeout: 30,
  maxLoginAttempts: 5
};

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const adminConfig = await getAdminConfig();
        console.log('Loaded config:', adminConfig); // Debug log
        const admins = await getAllAdminUsers();
        setAdminUsers(admins);
        setConfig(adminConfig || defaultAdminConfig);
        setMessage({ text: '', type: '' });
      } catch (error) {
        setMessage({ 
          text: 'Failed to load settings. Please try again later.', 
          type: 'error' 
        });
        setConfig(defaultAdminConfig);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev!,
      [name]: name.includes('Percent') || name.includes('minimum') 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSystemSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      console.log('Saving config:', config); // Debug log
      const result = await updateAdminConfig(config);
      console.log('Save result:', result); // Debug log
      setMessage({ 
        text: 'Settings saved successfully!', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ 
        text: 'Error saving settings. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  const handlePasswordReset = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setMessage({ text: 'Password must be at least 8 characters', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const success = await updateAdminPassword('admin@growwpark.com', passwordData.newPassword);
      if (success) {
        setMessage({ 
          text: 'Password updated successfully!', 
          type: 'success' 
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setMessage({ 
          text: 'Failed to update password', 
          type: 'error' 
        });
      }
    } catch (error) {
      setMessage({ 
        text: 'Error updating password. Please try again.', 
        type: 'error' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-2xl mx-auto">
        <h3 className="font-bold">Configuration Error</h3>
        <p>{message.text || 'Failed to load configuration.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600">Configure platform settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !config}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader className="animate-spin h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === 'error' 
            ? 'bg-red-50 text-red-700' 
            : 'bg-green-50 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Settings Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {['general', 'security', 'notifications', 'system', 'admins'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'general' && <Globe className="inline h-4 w-4 mr-2" />}
                {tab === 'security' && <Shield className="inline h-4 w-4 mr-2" />}
                {tab === 'notifications' && <Mail className="inline h-4 w-4 mr-2" />}
                {tab === 'system' && <Database className="inline h-4 w-4 mr-2" />}
                {tab === 'admins' && <Users className="inline h-4 w-4 mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">General Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Site Name
                    </label>
                    <input
                      type="text"
                      name="siteName"
                      value={systemSettings.siteName}
                      onChange={handleSystemSettingsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={systemSettings.contactEmail}
                      onChange={handleSystemSettingsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Support Phone
                    </label>
                    <input
                      type="tel"
                      name="supportPhone"
                      value={systemSettings.supportPhone}
                      onChange={handleSystemSettingsChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Wallet Address
                    </label>
                    <input
                      type="text"
                      name="depositWalletAddress"
                      value={config.depositWalletAddress}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="GPK Coin wallet address"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Description
                  </label>
                  <textarea
                    name="siteDescription"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, siteDescription: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Two-Factor Authentication</label>
                      <p className="text-xs text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <input
                      type="checkbox"
                      name="twoFactorAuth"
                      checked={systemSettings.twoFactorAuth}
                      onChange={handleSystemSettingsChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Auto-Approve Deposits</label>
                      <p className="text-xs text-gray-500">Automatically approve deposit transactions</p>
                    </div>
                    <input
                      type="checkbox"
                      name="autoApproveDeposits"
                      checked={systemSettings.autoApproveDeposits}
                      onChange={handleSystemSettingsChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Maintenance Mode</label>
                      <p className="text-xs text-gray-500">Put the platform in maintenance mode</p>
                    </div>
                    <input
                      type="checkbox"
                      name="maintenanceMode"
                      checked={systemSettings.maintenanceMode}
                      onChange={handleSystemSettingsChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        name="sessionTimeout"
                        value={systemSettings.sessionTimeout}
                        onChange={handleSystemSettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="5"
                        max="120"
                      />
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        name="maxLoginAttempts"
                        value={systemSettings.maxLoginAttempts}
                        onChange={handleSystemSettingsChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="3"
                        max="10"
                      />
                    </div>
                  </div>

                  {/* Password Reset Section */}
                  <div className="border-t pt-6 mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Password Reset</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter new password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                      
                      <button
                        onClick={handlePasswordReset}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <Loader className="animate-spin h-4 w-4" />
                        ) : (
                          <Lock className="h-4 w-4" />
                        )}
                        <span>{saving ? 'Updating...' : 'Update Password'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">Email Notifications</label>
                      <p className="text-xs text-gray-500">Send email notifications to users</p>
                    </div>
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={systemSettings.emailNotifications}
                      onChange={handleSystemSettingsChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="text-sm font-medium text-gray-900">SMS Notifications</label>
                      <p className="text-xs text-gray-500">Send SMS notifications to users</p>
                    </div>
                    <input
                      type="checkbox"
                      name="smsNotifications"
                      checked={systemSettings.smsNotifications}
                      onChange={handleSystemSettingsChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Deposit (GPK)
                    </label>
                    <input
                      type="number"
                      name="minimumDeposit"
                      value={config.minimumDeposit}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Withdrawal (GPK)
                    </label>
                    <input
                      type="number"
                      name="minimumWithdrawal"
                      value={config.minimumWithdrawal}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Fee (%)
                    </label>
                    <input
                      type="number"
                      name="depositFeePercent"
                      value={config.depositFeePercent}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Withdrawal Fee (%)
                    </label>
                    <input
                      type="number"
                      name="withdrawalFeePercent"
                      value={config.withdrawalFeePercent}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GPK Coin Price (INR)
                    </label>
                    <input
                      type="number"
                      name="gpkToInrPrice"
                      value={config.gpkToInrPrice}
                      onChange={handleConfigChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      step="0.01"
                      placeholder="Enter GPK price in INR"
                    />
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Database Actions</h4>
                <div className="flex flex-wrap gap-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    Backup Database
                  </button>
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Clear Cache
                  </button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Reset Demo Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Management */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Super Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adminUsers.map((admin) => (
                        <tr key={admin.email}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.is_super_admin ? 'Yes' : 'No'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.permissions?.join(', ') || 'None'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">Online</div>
            <div className="text-sm text-gray-600">System Status</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">99.9%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">v1.0.0</div>
            <div className="text-sm text-gray-600">Platform Version</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;