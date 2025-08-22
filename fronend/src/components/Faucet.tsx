import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../services/api';
import type { Account } from '../services/api';

interface FaucetInfo {
  faucetAmount: number;
  faucetBalance: number;
  cooldownHours: number;
  totalClaims: number;
}

interface FaucetEligibility {
  canUse: boolean;
  reason: string;
  remainingTime?: number;
}

const Faucet: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);
  const [eligibility, setEligibility] = useState<FaucetEligibility | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchData = async () => {
    try {
      const [accountsData, faucetInfoData] = await Promise.all([
        blockchainApi.getAccounts(),
        blockchainApi.getFaucetInfo()
      ]);
      setAccounts(accountsData);
      setFaucetInfo(faucetInfoData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load faucet data');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedAddress) {
      checkEligibility();
    } else {
      setEligibility(null);
    }
  }, [selectedAddress]);

  const checkEligibility = async () => {
    if (!selectedAddress) return;
    
    try {
      const result = await blockchainApi.checkFaucetEligibility(selectedAddress);
      setEligibility(result);
    } catch (err) {
      console.error('Failed to check eligibility:', err);
    }
  };

  const handleClaim = async () => {
    if (!selectedAddress) {
      setError('Please select an account');
      return;
    }

    if (!eligibility?.canUse) {
      setError('You are not eligible to use the faucet');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await blockchainApi.claimFromFaucet(selectedAddress);
      setSuccess(`${result.message} Transaction ID: ${result.transactionId}`);
      
      // 刷新数据
      await fetchData();
      await checkEligibility();
      
      // 刷新账户列表
      const updatedAccounts = await blockchainApi.getAccounts();
      setAccounts(updatedAccounts);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to claim tokens');
    } finally {
      setLoading(false);
    }
  };

  const formatRemainingTime = (remainingTime?: number) => {
    if (!remainingTime) return '';
    
    const hours = Math.floor(remainingTime / (60 * 60 * 1000));
    const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getSelectedAccount = () => {
    return accounts.find(account => 
      account.address === selectedAddress || account.alias === selectedAddress
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">代币水龙头</h2>
        <p className="text-gray-600 mb-6">
          免费获取测试代币！每个账户每24小时可以领取一次。
        </p>

        {/* 水龙头信息 */}
        {faucetInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-600">每次发放</h3>
              <p className="text-2xl font-bold text-blue-600">{faucetInfo.faucetAmount}</p>
              <p className="text-xs text-gray-500">tokens</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">水龙头余额</h3>
              <p className="text-2xl font-bold text-green-600">{faucetInfo.faucetBalance.toLocaleString()}</p>
              <p className="text-xs text-gray-500">tokens</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">冷却时间</h3>
              <p className="text-2xl font-bold text-orange-600">{faucetInfo.cooldownHours}</p>
              <p className="text-xs text-gray-500">小时</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">总领取次数</h3>
              <p className="text-2xl font-bold text-purple-600">{faucetInfo.totalClaims}</p>
              <p className="text-xs text-gray-500">次</p>
            </div>
          </div>
        )}

        {/* 错误和成功消息 */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        {/* 领取表单 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择账户
            </label>
            <select
              value={selectedAddress}
              onChange={(e) => setSelectedAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">选择要领取代币的账户</option>
              {accounts.map(account => (
                <option key={account.address} value={account.alias || account.address}>
                  {account.alias ? `${account.alias} (${account.address.substring(0, 10)}...)` : account.address} 
                  ({account.balance.toFixed(2)} tokens)
                </option>
              ))}
            </select>
          </div>

          {/* 资格状态 */}
          {selectedAddress && eligibility && (
            <div className={`p-4 rounded-lg ${
              eligibility.canUse ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  eligibility.canUse ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
                <span className={`font-medium ${
                  eligibility.canUse ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {eligibility.canUse ? '✓ 可以领取' : '⏳ 暂不可领取'}
                </span>
              </div>
              <p className={`text-sm mt-2 ${
                eligibility.canUse ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {eligibility.reason}
                {eligibility.remainingTime && (
                  <span className="font-medium">
                    {' '}(剩余时间: {formatRemainingTime(eligibility.remainingTime)})
                  </span>
                )}
              </p>
            </div>
          )}

          {/* 选中账户信息 */}
          {selectedAddress && getSelectedAccount() && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">账户信息</h4>
              <div className="text-sm space-y-1">
                {getSelectedAccount()?.alias && (
                  <p><span className="font-medium">别名:</span> {getSelectedAccount()?.alias}</p>
                )}
                <p><span className="font-medium">地址:</span> <span className="font-mono">{getSelectedAccount()?.address}</span></p>
                <p><span className="font-medium">当前余额:</span> {getSelectedAccount()?.balance.toFixed(2)} tokens</p>
              </div>
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={loading || !selectedAddress || !eligibility?.canUse}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '领取中...' : `领取 ${faucetInfo?.faucetAmount || 0} tokens`}
          </button>

          <button
            onClick={fetchData}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
          >
            刷新数据
          </button>
        </div>
      </div>
    </div>
  );
};

export default Faucet;