import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../services/api';
import type { Account } from '../services/api';

const AutoMiningManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [miningStatus, setMiningStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // 自动挖矿配置
  const [autoMiningConfig, setAutoMiningConfig] = useState({
    autoMineInterval: 10000,      // 10秒检查一次
    minTransactionsToMine: 1,     // 1笔交易就开始挖矿
    maxBlockTime: 30000          // 30秒强制出块
  });

  // 新矿工表单
  const [newMinerForm, setNewMinerForm] = useState({
    minerAddress: '',
    hashPower: 1.0
  });

  const fetchData = async () => {
    try {
      const [accountsData, statusData] = await Promise.all([
        blockchainApi.getAccounts(),
        blockchainApi.getMiningStatus()
      ]);
      setAccounts(accountsData);
      setMiningStatus(statusData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // 每5秒刷新状态
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartAutoMining = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await blockchainApi.startAutoMining(autoMiningConfig);
      setSuccess(`自动挖矿系统已启动! ${result.message}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '启动自动挖矿失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStopAutoMining = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await blockchainApi.stopAutoMining();
      setSuccess(`自动挖矿系统已停止! ${result.message}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '停止自动挖矿失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMiner = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!newMinerForm.minerAddress) {
        throw new Error('请选择矿工地址');
      }

      const result = await blockchainApi.addMiner(
        newMinerForm.minerAddress, 
        newMinerForm.hashPower
      );
      
      setSuccess(`矿工已加入网络! ${result.message} (总矿工数: ${result.totalMiners})`);
      setNewMinerForm({ minerAddress: '', hashPower: 1.0 });
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '添加矿工失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMiner = async (minerAddress: string) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await blockchainApi.removeMiner(minerAddress);
      setSuccess(`矿工已离开网络! ${result.message}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '移除矿工失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCompetition = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await blockchainApi.startMiningCompetition();
      setSuccess(`挖矿竞争已触发! ${result.message}`);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || '触发挖矿竞争失败');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    if (milliseconds < 1000) return `${milliseconds}ms`;
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(1)}s`;
    return `${(milliseconds / 60000).toFixed(1)}min`;
  };

  const formatHashPower = (hashPower: number) => {
    return `${hashPower.toFixed(1)}x`;
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

      {/* 自动挖矿概念说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-blue-400">
        <h3 className="text-xl font-bold text-gray-800 mb-3">🤖 自动挖矿 vs 手动挖矿</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-800">✋ 手动挖矿 (教学模式)</h4>
            <ul className="text-gray-700 space-y-1">
              <li>• 需要手动点击"开始挖矿"按钮</li>
              <li>• 适合理解挖矿过程</li>
              <li>• 一次只能挖一个区块</li>
              <li>• 方便观察每个步骤</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-purple-800">🤖 自动挖矿 (真实模拟)</h4>
            <ul className="text-gray-700 space-y-1">
              <li>• 系统自动检测并开始挖矿</li>
              <li>• 模拟真实区块链网络</li>
              <li>• 多个矿工同时竞争</li>
              <li>• 持续运行，无需干预</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 自动挖矿控制面板 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">🚀 自动挖矿系统</h3>
          
          <div className="space-y-4">
            {/* 当前状态 */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">系统状态</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">自动挖矿:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                    miningStatus?.autoMining 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {miningStatus?.autoMining ? '🟢 运行中' : '🔴 已停止'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">活跃矿工:</span>
                  <span className="ml-2 font-bold text-blue-600">
                    {miningStatus?.totalMiners || 0}
                  </span>
                </div>
              </div>
              
              {miningStatus?.config && (
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">检查间隔:</span>
                    <div className="font-mono">{formatTime(miningStatus.config.autoMineInterval)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">触发条件:</span>
                    <div className="font-mono">{miningStatus.config.minTransactionsToMine}tx</div>
                  </div>
                  <div>
                    <span className="text-gray-500">强制出块:</span>
                    <div className="font-mono">{formatTime(miningStatus.config.maxBlockTime)}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 配置参数 */}
            {!miningStatus?.autoMining && (
              <div className="space-y-3">
                <h4 className="font-semibold">配置参数</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      检查间隔 (毫秒)
                    </label>
                    <input
                      type="number"
                      value={autoMiningConfig.autoMineInterval}
                      onChange={(e) => setAutoMiningConfig(prev => ({
                        ...prev, 
                        autoMineInterval: parseInt(e.target.value) || 10000
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="1000"
                      step="1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最小交易数触发挖矿
                    </label>
                    <input
                      type="number"
                      value={autoMiningConfig.minTransactionsToMine}
                      onChange={(e) => setAutoMiningConfig(prev => ({
                        ...prev, 
                        minTransactionsToMine: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      最大区块间隔 (毫秒)
                    </label>
                    <input
                      type="number"
                      value={autoMiningConfig.maxBlockTime}
                      onChange={(e) => setAutoMiningConfig(prev => ({
                        ...prev, 
                        maxBlockTime: parseInt(e.target.value) || 30000
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      min="5000"
                      step="5000"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 控制按钮 */}
            <div className="flex gap-3">
              {!miningStatus?.autoMining ? (
                <button
                  onClick={handleStartAutoMining}
                  disabled={loading}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50 font-medium"
                >
                  {loading ? '启动中...' : '🚀 启动自动挖矿'}
                </button>
              ) : (
                <button
                  onClick={handleStopAutoMining}
                  disabled={loading}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 disabled:opacity-50 font-medium"
                >
                  {loading ? '停止中...' : '⏹️ 停止自动挖矿'}
                </button>
              )}
              
              <button
                onClick={handleTriggerCompetition}
                disabled={loading || !miningStatus?.totalMiners}
                className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50 font-medium"
              >
                {loading ? '竞争中...' : '⚡ 触发竞争'}
              </button>
            </div>
          </div>
        </div>

        {/* 矿工管理 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">👥 矿工网络</h3>

          {/* 添加矿工 */}
          <form onSubmit={handleAddMiner} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择矿工账户
              </label>
              <select
                value={newMinerForm.minerAddress}
                onChange={(e) => setNewMinerForm(prev => ({ ...prev, minerAddress: e.target.value }))}
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
                算力权重
              </label>
              <input
                type="number"
                value={newMinerForm.hashPower}
                onChange={(e) => setNewMinerForm(prev => ({ 
                  ...prev, 
                  hashPower: parseFloat(e.target.value) || 1.0 
                }))}
                step="0.1"
                min="0.1"
                max="10.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !newMinerForm.minerAddress}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? '添加中...' : '➕ 加入挖矿网络'}
            </button>
          </form>

          {/* 活跃矿工列表 */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700">
              活跃矿工 ({miningStatus?.miners?.length || 0})
            </h4>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {miningStatus?.miners && miningStatus.miners.length > 0 ? (
                miningStatus.miners.map((miner: any, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-800 font-mono">
                        {miner.alias ? `${miner.alias} (${miner.address.substring(0, 10)}...)` : miner.address}
                      </div>
                      <div className="text-xs text-gray-600">
                        算力: {formatHashPower(miner.hashPower)} | 
                        状态: <span className="text-green-600 font-medium">{miner.isActive ? '🟢 活跃' : '🔴 离线'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMiner(miner.address)}
                      disabled={loading}
                      className="text-red-500 hover:text-red-700 disabled:opacity-50 text-sm font-medium px-2"
                    >
                      移除
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">暂无矿工加入网络</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 挖矿统计信息 */}
      {miningStatus?.stats && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">📊 挖矿统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {miningStatus.stats.totalBlocksMined || 0}
              </div>
              <div className="text-sm text-gray-600">已挖区块</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {miningStatus.stats.totalRewardsPaid || 0}
              </div>
              <div className="text-sm text-gray-600">总奖励</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {miningStatus.stats.averageMiningTime ? formatTime(miningStatus.stats.averageMiningTime) : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">平均挖矿时间</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {miningStatus.stats.networkHashRate?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">网络算力</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoMiningManager;