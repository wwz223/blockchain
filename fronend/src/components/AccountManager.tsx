import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../services/api';
import type { Account } from '../services/api';

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccountAlias, setNewAccountAlias] = useState('');
  const [newAccountAddress, setNewAccountAddress] = useState('');
  const [createMode, setCreateMode] = useState<'alias' | 'address'>('alias');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const fetchAccounts = async () => {
    try {
      const accountsData = await blockchainApi.getAccounts();
      setAccounts(accountsData);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (createMode === 'alias' && !newAccountAlias.trim()) {
      setError('请输入账户别名');
      return;
    }
    
    if (createMode === 'address' && !newAccountAddress.trim()) {
      setError('请输入账户地址');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let result;
      if (createMode === 'alias') {
        result = await blockchainApi.createAccount(newAccountAlias.trim());
        setSuccess(`账户创建成功!\n别名: ${result.alias}\n地址: ${result.address}`);
        setNewAccountAlias('');
      } else {
        result = await blockchainApi.createAccount(undefined, newAccountAddress.trim());
        setSuccess(`账户创建成功!\n地址: ${result.address}`);
        setNewAccountAddress('');
      }
      await fetchAccounts();
    } catch (err: any) {
      setError(err.response?.data?.error || '创建账户失败');
    } finally {
      setLoading(false);
    }
  };

  const generateRandomAddress = () => {
    const chars = '0123456789abcdef';
    let result = '0x';
    for (let i = 0; i < 40; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAccountAddress(result);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const refreshBalance = async (address: string) => {
    try {
      const balanceData = await blockchainApi.getAccountBalance(address);
      setAccounts(prev => 
        prev.map(account => 
          account.address === address 
            ? { ...account, balance: balanceData.balance }
            : account
        )
      );
    } catch (err) {
      console.error('Failed to refresh balance:', err);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`已复制地址: ${text}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      setError('复制失败，请手动复制');
      setTimeout(() => setError(''), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">账户管理</h2>

        {/* 创建新账户表单 */}
        <form onSubmit={handleCreateAccount} className="mb-6">
          {/* 创建模式切换 */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setCreateMode('alias')}
              className={`px-4 py-2 rounded-md ${
                createMode === 'alias' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              通过别名创建
            </button>
            <button
              type="button"
              onClick={() => setCreateMode('address')}
              className={`px-4 py-2 rounded-md ${
                createMode === 'address' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              通过地址创建
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {createMode === 'alias' ? (
              <input
                type="text"
                value={newAccountAlias}
                onChange={(e) => setNewAccountAlias(e.target.value)}
                placeholder="输入账户别名 (例如: alice, bob, charlie)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            ) : (
              <>
                <input
                  type="text"
                  value={newAccountAddress}
                  onChange={(e) => setNewAccountAddress(e.target.value)}
                  placeholder="输入账户地址 (例如: 0x742d35Cc6C82C45F8..)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={generateRandomAddress}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
                  disabled={loading}
                >
                  随机生成
                </button>
              </>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '创建中...' : '创建账户'}
            </button>
          </div>
        </form>

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

        {/* 账户列表 */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  别名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  地址
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  余额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.address} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">
                      {account.alias || '无别名'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 font-mono break-all flex-1">
                        {account.address}
                      </div>
                      <button
                        onClick={() => copyToClipboard(account.address)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        title="复制地址"
                      >
                        复制
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {account.balance.toFixed(2)} tokens
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(account.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => refreshBalance(account.address)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      刷新余额
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {accounts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            暂无账户，请创建第一个账户
          </div>
        )}

        <button
          onClick={fetchAccounts}
          className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          刷新账户列表
        </button>
      </div>
    </div>
  );
};

export default AccountManager;