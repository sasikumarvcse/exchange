import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Eye, Loader2, Bug } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isAdmin, debugUserStatus } from '../../utils/auth';
import type { Database } from '../../lib/supabase';

type PackageType = Database['public']['Tables']['packages']['Row'];

const AdminPackages: React.FC = () => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'view'>('create');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    roi: '',
    description: '',
    benefits: [''],
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPackages();
    const interval = setInterval(loadPackages, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('packages').select('*');
      if (error) {
        console.error('Load packages error:', error);
        throw error;
      }
      setPackages(data || []);
    } catch (error: any) {
      console.error('Load packages error:', error);
      setError('Error loading packages: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handlePackageAction = (pkg: PackageType | null, action: 'create' | 'edit' | 'view') => {
    setSelectedPackage(pkg);
    setModalType(action);
    if (pkg) {
      setFormData({
        name: pkg.name,
        price: pkg.price.toString(),
        roi: pkg.roi.toString(),
        description: pkg.description,
        benefits: pkg.benefits,
        is_active: pkg.is_active
      });
    } else {
      setFormData({
        name: '',
        price: '',
        roi: '',
        description: '',
        benefits: [''],
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleBenefitChange = (index: number, value: string) => {
    const newBenefits = [...formData.benefits];
    newBenefits[index] = value;
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const addBenefit = () => {
    setFormData(prev => ({ ...prev, benefits: [...prev.benefits, ''] }));
  };

  const removeBenefit = (index: number) => {
    const newBenefits = formData.benefits.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, benefits: newBenefits }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const packageData = {
        id: modalType === 'create' ? crypto.randomUUID() : selectedPackage?.id,
        name: formData.name,
        price: parseFloat(formData.price),
        roi: parseFloat(formData.roi),
        description: formData.description,
        benefits: formData.benefits.filter(b => b.trim() !== ''),
        is_active: formData.is_active
      };

      if (modalType === 'create') {
        const { data, error } = await supabase.from('packages').insert([packageData]).select();
        
        if (error) {
          console.error('Create package error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          console.error('Full error object:', JSON.stringify(error, null, 2));
          throw error;
        }
      } else if (modalType === 'edit' && selectedPackage) {
        const { data, error } = await supabase.from('packages').update(packageData).eq('id', selectedPackage.id).select();
        
        if (error) {
          console.error('Update package error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
      }
      }
      
      setShowModal(false);
      await loadPackages();
    } catch (error: any) {
      console.error('Submit error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        stack: error.stack
      });
      console.error('Full submit error object:', JSON.stringify(error, null, 2));
      setError('Error saving package: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (pkg: PackageType) => {
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.from('packages').delete().eq('id', pkg.id);
      if (error) {
        console.error('Delete package error:', error);
        throw error;
      }
      
      await loadPackages();
    } catch (error: any) {
      console.error('Delete error:', error);
      setError('Error deleting package: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  const togglePackageStatus = async (pkg: PackageType) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.from('packages').update({ is_active: !pkg.is_active }).eq('id', pkg.id).select();
      if (error) {
        console.error('Toggle package status error:', error);
        throw error;
      }
      
      await loadPackages();
    } catch (error: any) {
      console.error('Toggle error:', error);
      setError('Error toggling package status: ' + (error.message || error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Package Management</h1>
          <p className="text-gray-600">Manage MLM packages and pricing</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={debugUserStatus}
            className="inline-flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="Debug user status"
          >
            <Bug className="h-4 w-4" />
            <span>Debug</span>
          </button>
        <button
          onClick={() => handlePackageAction(null, 'create')}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Package</span>
        </button>
      </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700 underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading packages...</span>
        </div>
      )}
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Packages</p>
              <p className="text-2xl font-bold text-blue-600">{packages.length}</p>
            </div>
            <Package className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Packages</p>
              <p className="text-2xl font-bold text-green-600">
                {packages.filter(p => p.is_active).length}
              </p>
            </div>
            <Package className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-purple-600">
                ${packages.length > 0 ? (packages.reduce((sum, p) => sum + p.price, 0) / packages.length).toFixed(0) : '0'}
              </p>
            </div>
            <Package className="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>
      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mb-4">
                <div className="text-2xl font-bold text-blue-600">{pkg.price} GPK</div>
                <div className="text-sm text-gray-600">ROI: {pkg.roi}%</div>
              </div>
              <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {pkg.benefits.slice(0, 3).map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {benefit}
                    </li>
                  ))}
                  {pkg.benefits.length > 3 && (
                    <li className="text-gray-500">+{pkg.benefits.length - 3} more...</li>
                  )}
                </ul>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => togglePackageStatus(pkg)}
                  disabled={loading}
                  className={`px-3 py-1 text-xs rounded-lg ${
                    pkg.is_active 
                      ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    pkg.is_active ? 'Deactivate' : 'Activate'
                  )}
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePackageAction(pkg, 'view')}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handlePackageAction(pkg, 'edit')}
                    className="text-green-600 hover:text-green-800"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    className="text-red-600 hover:text-red-800" 
                    onClick={() => handleDelete(pkg)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                    <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'create' && 'Create New Package'}
                {modalType === 'edit' && 'Edit Package'}
                {modalType === 'view' && 'Package Details'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Package Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (GPK)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                      disabled={modalType === 'view'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ROI (%)
                  </label>
                  <input
                    type="number"
                    name="roi"
                    value={formData.roi}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={modalType === 'view'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Benefits
                  </label>
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={benefit}
                        onChange={(e) => handleBenefitChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter benefit"
                        disabled={modalType === 'view'}
                      />
                      {modalType !== 'view' && formData.benefits.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBenefit(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {modalType !== 'view' && (
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      + Add Benefit
                    </button>
                  )}
                </div>
                {modalType !== 'view' && (
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Package is active
                    </label>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {modalType !== 'view' && (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center ${
                      loading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {modalType === 'create' ? 'Creating...' : 'Updating...'}
                      </>
                    ) : (
                      modalType === 'create' ? 'Create Package' : 'Update Package'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackages;