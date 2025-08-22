import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../services/api';
import type { Block, BlockchainInfo } from '../services/api';

const BlockchainExplorer: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [blockchainInfo, setBlockchainInfo] = useState<BlockchainInfo | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [blocksData, infoData] = await Promise.all([
        blockchainApi.getBlocks(),
        blockchainApi.getBlockchainInfo(),
      ]);
      setBlocks(blocksData.reverse()); // 最新的区块在前面
      setBlockchainInfo(infoData);
      setError('');
    } catch (err) {
      setError('Failed to fetch blockchain data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 每10秒刷新一次数据
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatHash = (hash: string, length = 10) => {
    return `${hash.substring(0, length)}...${hash.substring(hash.length - 4)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">区块链浏览器</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {blockchainInfo && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">区块高度</h3>
                <p className="text-2xl font-bold text-blue-600">{blockchainInfo.height}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">POW 难度</h3>
                <p className="text-2xl font-bold text-green-600">{blockchainInfo.difficulty}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">总交易数</h3>
                <p className="text-2xl font-bold text-purple-600">{blockchainInfo.totalTransactions}</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">总账户数</h3>
                <p className="text-2xl font-bold text-orange-600">{blockchainInfo.totalAccounts}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600">待处理交易</h3>
                <p className="text-2xl font-bold text-red-600">{blockchainInfo.pendingTransactions}</p>
              </div>
            </div>
            
            {/* POW 信息面板 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="text-sm font-medium text-gray-600">共识算法</h4>
                <p className="text-lg font-bold text-gray-800">{blockchainInfo.consensusAlgorithm}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">目标出块时间</h4>
                <p className="text-lg font-bold text-gray-800">{blockchainInfo.targetBlockTime / 1000}s</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">区块奖励</h4>
                <p className="text-lg font-bold text-gray-800">{blockchainInfo.miningReward} tokens</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600">难度调整间隔</h4>
                <p className="text-lg font-bold text-gray-800">{blockchainInfo.difficultyAdjustmentInterval} 区块</p>
              </div>
            </div>
          </>
        )}

        <button
          onClick={fetchData}
          className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          刷新数据
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 区块列表 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">最新区块</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {blocks.map((block) => (
              <div
                key={block.index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedBlock?.index === block.index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedBlock(block)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">区块 #{block.index}</p>
                    <p className="text-sm text-gray-600">
                      哈希: {formatHash(block.hash)}
                    </p>
                    <p className="text-sm text-gray-600">
                      交易: {block.transactions.length}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {formatTimestamp(block.timestamp)}
                    </p>
                    {block.miner && (
                      <p className="text-sm text-green-600 font-mono">
                        矿工: {block.miner}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 区块详情 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-bold mb-4 text-gray-800">区块详情</h3>
          {selectedBlock ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700">基本信息</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="font-medium">区块高度:</span> {selectedBlock.index}</p>
                  <p><span className="font-medium">哈希:</span> <span className="font-mono break-all">{selectedBlock.hash}</span></p>
                  <p><span className="font-medium">前一个哈希:</span> <span className="font-mono break-all">{selectedBlock.previousHash}</span></p>
                  <p><span className="font-medium">时间戳:</span> {formatTimestamp(selectedBlock.timestamp)}</p>
                  <p><span className="font-medium">随机数 (Nonce):</span> {selectedBlock.nonce?.toLocaleString()}</p>
                  {selectedBlock.miner && (
                    <>
                      <p><span className="font-medium">矿工:</span> <span className="font-mono break-all">{selectedBlock.miner}</span></p>
                      <p><span className="font-medium">POW 区块奖励:</span> {selectedBlock.reward} tokens</p>
                      {selectedBlock.miningTime > 0 && (
                        <>
                          <p><span className="font-medium">挖矿用时:</span> {selectedBlock.miningTime}ms</p>
                          <p><span className="font-medium">哈希率:</span> {selectedBlock.hashRate?.toFixed(2)} H/s</p>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-700">
                  交易 ({selectedBlock.transactions.length})
                </h4>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {selectedBlock.transactions.map((tx, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded border">
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">类型:</span> {tx.type}</p>
                        <p><span className="font-medium">从:</span> <span className="font-mono break-all">{tx.from || 'System'}</span></p>
                        <p><span className="font-medium">到:</span> <span className="font-mono break-all">{tx.to}</span></p>
                        <p><span className="font-medium">数量:</span> {tx.amount}</p>
                        <p><span className="font-medium">时间:</span> {formatTimestamp(tx.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">选择一个区块查看详情</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlockchainExplorer;