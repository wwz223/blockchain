import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../services/api';
import type { Account, Transaction } from '../services/api';

const TransactionManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 转账表单
  const [transferForm, setTransferForm] = useState({
    from: '',
    to: '',
    amount: ''
  });

  // 移除铸币表单 - 不再支持随意铸造代币

  // 挖矿表单
  const [minerAddress, setMinerAddress] = useState('');

  const fetchData = async () => {
    try {
      const [accountsData, pendingData] = await Promise.all([
        blockchainApi.getAccounts(),
        blockchainApi.getPendingTransactions()
      ]);
      setAccounts(accountsData);
      setPendingTransactions(pendingData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const amount = parseFloat(transferForm.amount);
      if (!transferForm.from || !transferForm.to || !amount || amount <= 0) {
        throw new Error('请填写所有字段，金额必须大于0');
      }

      await blockchainApi.createTransaction(transferForm.from, transferForm.to, amount);
      setSuccess(`转账交易创建成功! ${transferForm.amount} tokens 从 ${transferForm.from} 转给 ${transferForm.to}`);
      setTransferForm({ from: '', to: '', amount: '' });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '转账失败');
    } finally {
      setLoading(false);
    }
  };

  // 移除铸币处理函数

  const handleMine = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!minerAddress) {
        throw new Error('请选择矿工地址');
      }

      const result = await blockchainApi.mine(minerAddress);
      setSuccess(
        `挖矿成功! 矿工 ${result.minerAddress} 获得奖励，当前余额: ${result.newBalance} tokens。区块高度: ${result.blockHeight}`
      );
      setMinerAddress('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '挖矿失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* 错误和成功消息 */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 转账表单 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">转账</h3>
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                发送方
              </label>
              <select
                value={transferForm.from}
                onChange={(e) => setTransferForm(prev => ({ ...prev, from: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">选择账户</option>
                {accounts.map(account => (
                  <option key={account.address} value={account.alias || account.address}>
                    {account.alias ? `${account.alias} (${account.address.substring(0, 10)}...)` : account.address} ({account.balance.toFixed(2)} tokens)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                接收方
              </label>
              <select
                value={transferForm.to}
                onChange={(e) => setTransferForm(prev => ({ ...prev, to: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">选择账户</option>
                {accounts.map(account => (
                  <option key={account.address} value={account.alias || account.address}>
                    {account.alias ? `${account.alias} (${account.address.substring(0, 10)}...)` : account.address}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                金额
              </label>
              <input
                type="number"
                value={transferForm.amount}
                onChange={(e) => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="输入转账金额"
                step="0.01"
                min="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '处理中...' : '创建转账交易'}
            </button>
          </form>
        </div>

        {/* 铸造代币功能已移除 - 真实区块链中不应该允许随意铸造 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">代币获取方式</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800">💧 水龙头</h4>
              <p className="text-blue-700 text-sm mt-1">
                访问"代币水龙头"标签页，免费领取测试代币
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800">⛏️ 挖矿奖励</h4>
              <p className="text-green-700 text-sm mt-1">
                通过挖矿获得区块奖励（每个区块10 tokens）
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-800">💸 转账接收</h4>
              <p className="text-orange-700 text-sm mt-1">
                通过其他用户转账获得代币
              </p>
            </div>
          </div>
        </div>

        {/* 挖矿表单 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">挖矿</h3>
          <form onSubmit={handleMine} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                矿工地址
              </label>
              <select
                value={minerAddress}
                onChange={(e) => setMinerAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={loading}
              >
                <option value="">选择矿工账户</option>
                {accounts.map(account => (
                  <option key={account.address} value={account.alias || account.address}>
                    {account.alias ? `${account.alias} (${account.address.substring(0, 10)}...)` : account.address} ({account.balance.toFixed(2)} tokens)
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-gray-600">
              <p>待处理交易: {pendingTransactions.length}</p>
              <p>POW 区块奖励: 10 tokens</p>
              <p>目标出块时间: 10秒</p>
            </div>

            <button
              type="submit"
              disabled={loading || pendingTransactions.length === 0}
              className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? '挖矿中...' : '开始挖矿'}
            </button>
          </form>
        </div>

        {/* 待处理交易列表 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">
            待处理交易 ({pendingTransactions.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingTransactions.length > 0 ? (
              pendingTransactions.map((tx, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">类型:</span> {tx.type}</p>
                    <p><span className="font-medium">从:</span> <span className="font-mono break-all">{tx.from || 'System'}</span></p>
                    <p><span className="font-medium">到:</span> <span className="font-mono break-all">{tx.to}</span></p>
                    <p><span className="font-medium">金额:</span> {tx.amount}</p>
                    <p><span className="font-medium">时间:</span> {formatTimestamp(tx.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">暂无待处理交易</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionManager;