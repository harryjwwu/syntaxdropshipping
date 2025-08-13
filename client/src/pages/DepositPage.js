import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletAPI } from '../utils/api';
import { 
  ArrowLeft, 
  Building2, 
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const DepositPage = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('bank_transfer');
  const [amount, setAmount] = useState('');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [bankInfo, setBankInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showBankInfo, setShowBankInfo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 加载银行信息
    loadBankInfo();
  }, [selectedCurrency]);

  const loadBankInfo = async () => {
    try {
      const response = await walletAPI.getBankInfo(selectedCurrency);
      setBankInfo(response.data);
    } catch (error) {
      console.error('Error loading bank info:', error);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 验证文件大小（10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // 验证文件类型
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      
      setPaymentSlip(file);
    }
  };

  const handleCheckout = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (selectedPaymentMethod === 'bank_transfer') {
      setShowBankInfo(true);
    } else {
      // For PayPal, you might redirect to PayPal or show PayPal info
      toast.info('PayPal payment will be implemented soon');
    }
  };

  const handleSubmitDeposit = async () => {
    if (!paymentSlip) {
      toast.error('Please upload your payment slip');
      return;
    }

    try {
      setLoading(true);
      
      const depositData = {
        amount: parseFloat(amount),
        paymentMethod: selectedPaymentMethod,
        paymentSlip,
        bankInfo: selectedPaymentMethod === 'bank_transfer' ? bankInfo : null
      };

      const response = await walletAPI.createDeposit(depositData);
      
      toast.success('Deposit request submitted successfully!');
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast.error(error.response?.data?.message || 'Failed to submit deposit request');
    } finally {
      setLoading(false);
    }
  };

  const currencies = [
    { code: 'USD', name: 'USD', flag: '🇺🇸' },
    { code: 'EUR', name: 'EUR', flag: '🇪🇺' },
    { code: 'OTHERS', name: 'OTHERS', flag: '🌍' }
  ];

  const paymentMethods = [
    { 
      id: 'bank_transfer', 
      name: 'Bank Transfer', 
      icon: Building2,
      description: 'Direct bank transfer'
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      icon: CreditCard,
      description: 'PayPal payment'
    },
    { 
      id: 'wise', 
      name: 'Wise/Revolut', 
      icon: CreditCard,
      description: 'Wise or Revolut transfer',
      disabled: true
    }
  ];

  if (showBankInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <button
                onClick={() => setShowBankInfo(false)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Payment
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Bank Transfer Information</h1>
              <div className="w-20"></div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Here is our banking account information
            </h2>

            {/* Bank Account Information Table */}
            {bankInfo && (
              <div className="overflow-x-auto mb-6">
                <table className="w-full border-collapse border border-gray-300">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Account Number</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.account_number}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Holder Name</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.account_name}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Support Currency</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.currency}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Bank</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.bank_name}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Location Country</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.country}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Bank Address</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.bank_address}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Account Type</td>
                      <td className="border border-gray-300 px-4 py-3">Business Account</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Swift Code</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.swift_code}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Bank Code/Routing Number</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.routing_number}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-4 py-3 bg-gray-50 font-medium">Branch Code</td>
                      <td className="border border-gray-300 px-4 py-3">{bankInfo.branch_code}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Transfer Summary */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submit Transfer Slip</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <div className="text-lg font-semibold">{amount} USD</div>
                </div>
                <div>
                  <span className="text-sm text-gray-600">You Need To Pay:</span>
                  <div className="text-lg font-semibold">{amount} USD</div>
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Transfer Slip*
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".jpg,.jpeg,.png,.pdf"
                    className="hidden"
                    id="payment-slip-upload"
                  />
                  <label
                    htmlFor="payment-slip-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {paymentSlip ? (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-8 h-8 mb-2" />
                        <span className="ml-2">{paymentSlip.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600">
                          Click to upload your payment slip
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="ml-3 text-sm text-red-700">
                    Please upload your successful payment voucher to our system as you have been doing before, 
                    so that our system will automatically generate an invoice based on your payment.
                  </div>
                </div>
              </div>

              <div className="text-center">
                <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                  Example
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowBankInfo(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDeposit}
                disabled={loading || !paymentSlip}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Deposit</h1>
            <div className="w-20"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Currency Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Currency</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => setSelectedCurrency(currency.code)}
                  className={`p-4 border-2 rounded-lg text-center transition-colors ${
                    selectedCurrency === currency.code
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{currency.flag}</div>
                  <div className="font-medium">{currency.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => !method.disabled && setSelectedPaymentMethod(method.id)}
                    disabled={method.disabled}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      method.disabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : selectedPaymentMethod === method.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-8 h-8 mx-auto mb-2" />
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{method.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add amount</h3>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom payment*
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded text-sm">
                    USD
                  </div>
                </div>
              </div>
              <div className="text-gray-500">
                You Will Get {parseFloat(amount) || 0}.00 USD
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="text-center">
            <button
              onClick={handleCheckout}
              disabled={!amount || parseFloat(amount) <= 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;
