import { AlertCircle, CheckCircle, Copy, Loader2, Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { Transaction } from '../../types';
import { getCurrentUser } from '../../utils/auth';
import { getAdminConfig } from '../../utils/database';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface DepositFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DepositForm: React.FC<DepositFormProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1); // 1: Enter Amount, 2: Show QR & Details, 3: Success
  const [amount, setAmount] = useState('');
  const [transactionPassword, setTransactionPassword] = useState('');
  const [txHash, setTxHash] = useState('');
  const [referenceId, setReferenceId] = useState('');
  const [loading, setLoading] = useState({
    config: true,
    submit: false
  });
  const [error, setError] = useState('');

  const [adminConfig, setAdminConfig] = useState({
    minimumDeposit: 100,
    depositFeePercent: 0,
    depositWalletAddress: '',
    gpkToInrPrice: 100 // Added for INR conversion
  });
  const user = getCurrentUser();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAdminConfig();
        setAdminConfig(config || {
          minimumDeposit: 100,
          depositFeePercent: 0,
          depositWalletAddress: '',
          gpkToInrPrice: 100
        });
      } catch (err) {
        console.error('Failed to load config:', err);
        setError('Failed to load configuration. Using default settings.');
      } finally {
        setLoading(prev => ({ ...prev, config: false }));
      }
    };
    loadConfig();
  }, []);

  const handleAmountSubmit = async () => {
    setError('');
    
    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount');
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (amountNum < adminConfig.minimumDeposit) {
      setError(`Minimum deposit amount is ${adminConfig.minimumDeposit} GPK`);
      return;
    }

    if (!transactionPassword) {
      setError('Transaction password is required');
      return;
    }

    // Generate reference ID
    const refId = `DEP${Date.now()}${user?.id?.slice(-4) || '0000'}`;
    setReferenceId(refId);
    setStep(2);
  };

  const handleTxHashSubmit = async () => {
    if (!txHash || txHash.length < 10) {
      setError('Please enter a valid transaction hash');
      return;
    }

    if (!user) return;

    setLoading(prev => ({ ...prev, submit: true }));
    setError('');
    
    try {
      const depositAmount = parseFloat(amount);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate_deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
        user_id: user.id,
          transaction_password: transactionPassword.trim(),
        amount: depositAmount,
        tx_hash: txHash,
        reference_id: referenceId,
          wallet_address: adminConfig.depositWalletAddress
        })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Deposit failed');
        return;
      }
      setStep(3);
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Copy failed:', err);
      });
  };

  const shareDepositInfo = () => {
    const text = `GPK Coin Deposit\nAmount: ${amount} GPK\nAddress: ${adminConfig.depositWalletAddress}\nReference: ${referenceId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'GPK Coin Deposit Details',
        text
      }).catch(err => {
        console.error('Share failed:', err);
        copyToClipboard(text);
      });
    } else {
      copyToClipboard(text);
    }
  };

  // Calculate INR equivalent
  const gpkToInr = adminConfig.gpkToInrPrice || 100;
  const inrEquivalent = amount && !isNaN(Number(amount)) ? (parseFloat(amount) * gpkToInr).toFixed(2) : '0.00';

  if (loading.config) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Deposit Request Submitted!</h3>
        <p className="text-gray-600 mb-4">
          Your deposit request has been submitted for verification. 
          You will be notified once it's processed.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          <p><strong>Reference ID:</strong> {referenceId}</p>
          <p><strong>Amount:</strong> {amount} GPK</p>
          <p><strong>TX Hash:</strong> {txHash.substring(0, 20)}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          1
        </div>
        <div className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          2
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Step 1: Enter Amount */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (GPK)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter amount"
              min={adminConfig.minimumDeposit}
              step="0.01"
            />
            <p className="text-sm text-gray-500 mt-1">
              Minimum: {adminConfig.minimumDeposit} GPK
            </p>
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

          {amount && parseFloat(amount) >= adminConfig.minimumDeposit && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deposit Amount:</span>
                <span className="font-medium">{parseFloat(amount).toFixed(2)} GPK</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>INR Equivalent:</span>
                <span className="font-medium">₹{inrEquivalent}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-medium">
                  <span>You will get:</span>
                  <span className="text-green-600">
                    {parseFloat(amount).toFixed(2)} GPK for ₹{inrEquivalent}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAmountSubmit}
              disabled={!amount || !transactionPassword || parseFloat(amount) < adminConfig.minimumDeposit}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Show QR Code and Payment Details */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Send GPK Coin Payment
            </h3>
            <p className="text-gray-600 mb-4">
              Send exactly <strong>{parseFloat(amount).toFixed(2)} GPK</strong> to the address below
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <QRCode
              value={`${adminConfig.depositWalletAddress}?amount=${amount}&ref=${referenceId}`}
              size={200}
              className="mx-auto mb-4"
            />
            <p className="text-sm text-gray-600">Scan to send payment</p>
          </div>

          {/* Payment Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={adminConfig.depositWalletAddress}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(adminConfig.depositWalletAddress)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference ID
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={referenceId}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(referenceId)}
                  className="p-2 text-blue-600 hover:text-blue-800"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Send
              </label>
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-xl font-bold text-blue-900">{parseFloat(amount).toFixed(2)} GPK</span>
              </div>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={shareDepositInfo}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Payment Details</span>
          </button>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important Instructions:</p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>Send exactly {parseFloat(amount).toFixed(2)} GPK to the above address</li>
                  <li>Include the reference ID in the transaction memo (if supported)</li>
                  <li>Wait for transaction confirmation before proceeding</li>
                  <li>Keep your transaction hash for verification</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Transaction Hash Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Hash (After Payment)
            </label>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter transaction hash after sending payment"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleTxHashSubmit}
              disabled={!txHash || txHash.length < 10 || loading.submit}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading.submit ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepositForm;