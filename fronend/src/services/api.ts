import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface BlockchainInfo {
  height: number;
  difficulty: number;
  totalTransactions: number;
  totalAccounts: number;
  pendingTransactions: number;
  targetBlockTime: number;
  difficultyAdjustmentInterval: number;
  miningReward: number;
  consensusAlgorithm: string;
}

export interface Account {
  address: string;
  alias?: string;
  balance: number;
  transactions: any[];
  createdAt: number;
}

export interface Transaction {
  id: string;
  from: string | null;
  to: string;
  amount: number;
  type: string;
  timestamp: number;
  signature: string | null;
}

export interface Block {
  index: number;
  hash: string;
  previousHash: string;
  timestamp: number;
  transactions: Transaction[];
  miner: string | null;
  reward: number;
  nonce: number;
  miningTime: number;
  hashRate: number;
}

export const blockchainApi = {
  // 获取区块链基本信息
  getBlockchainInfo: async (): Promise<BlockchainInfo> => {
    const response = await api.get('/blockchain/info');
    return response.data.data;
  },

  // 获取所有区块
  getBlocks: async (): Promise<Block[]> => {
    const response = await api.get('/blocks');
    return response.data.data;
  },

  // 获取特定区块
  getBlock: async (index: number): Promise<Block> => {
    const response = await api.get(`/blocks/${index}`);
    return response.data.data;
  },

  // 创建新账户
  createAccount: async (alias?: string, address?: string): Promise<{ address: string; alias?: string }> => {
    const response = await api.post('/accounts', { alias, address });
    return response.data;
  },

  // 获取所有账户
  getAccounts: async (): Promise<Account[]> => {
    const response = await api.get('/accounts');
    return response.data.data;
  },

  // 获取账户余额
  getAccountBalance: async (address: string): Promise<{ address: string; balance: number }> => {
    const response = await api.get(`/accounts/${address}/balance`);
    return response.data.data;
  },

  // 创建交易
  createTransaction: async (from: string, to: string, amount: number): Promise<{ transactionId: string }> => {
    const response = await api.post('/transactions', { from, to, amount });
    return response.data;
  },

  // 获取待处理交易
  getPendingTransactions: async (): Promise<Transaction[]> => {
    const response = await api.get('/transactions/pending');
    return response.data.data;
  },

  // 挖矿
  mine: async (minerAddress: string): Promise<{
    minerAddress: string;
    newBalance: number;
    blockHeight: number;
  }> => {
    const response = await api.post('/mine', { minerAddress });
    return response.data;
  },

  // 移除铸造代币功能 - 在真实区块链中不应该允许随意铸造

  // 验证区块链
  validateBlockchain: async (): Promise<{ isValid: boolean }> => {
    const response = await api.get('/blockchain/validate');
    return response.data.data;
  },

  // 水龙头相关API
  getFaucetInfo: async (): Promise<{
    faucetAmount: number;
    faucetBalance: number;
    cooldownHours: number;
    totalClaims: number;
  }> => {
    const response = await api.get('/faucet/info');
    return response.data.data;
  },

  claimFromFaucet: async (address: string): Promise<{
    success: boolean;
    message: string;
    amount: number;
    transactionId: string;
    recipient: string;
  }> => {
    const response = await api.post('/faucet/claim', { address });
    return response.data;
  },

  checkFaucetEligibility: async (address: string): Promise<{
    canUse: boolean;
    reason: string;
    remainingTime?: number;
  }> => {
    const response = await api.get(`/faucet/check/${address}`);
    return response.data.data;
  },

  // 健康检查
  healthCheck: async (): Promise<{ message: string; timestamp: string }> => {
    const response = await api.get('/health');
    return response.data;
  },

  // ============================================
  // 🔥 自动挖矿系统 API
  // ============================================

  // 启动自动挖矿
  startAutoMining: async (config?: {
    autoMineInterval?: number;
    minTransactionsToMine?: number;
    maxBlockTime?: number;
  }): Promise<{
    success: boolean;
    message: string;
    config: any;
  }> => {
    const response = await api.post('/mining/auto/start', config || {});
    return response.data;
  },

  // 停止自动挖矿
  stopAutoMining: async (): Promise<{
    success: boolean;
    message: string;
    stats: any;
  }> => {
    const response = await api.post('/mining/auto/stop');
    return response.data;
  },

  // 添加矿工
  addMiner: async (minerAddress: string, hashPower?: number): Promise<{
    success: boolean;
    message: string;
    miner: any;
    totalMiners: number;
  }> => {
    const response = await api.post('/mining/miners/add', { 
      minerAddress, 
      hashPower: hashPower || 1.0 
    });
    return response.data;
  },

  // 移除矿工
  removeMiner: async (minerAddress: string): Promise<{
    success: boolean;
    message: string;
    remainingMiners: number;
  }> => {
    const response = await api.post('/mining/miners/remove', { minerAddress });
    return response.data;
  },

  // 获取挖矿状态
  getMiningStatus: async (): Promise<{
    autoMining: boolean;
    totalMiners: number;
    miners: any[];
    config: any;
    stats: any;
    lastBlockTime: number;
    nextBlockEstimate: number;
  }> => {
    const response = await api.get('/mining/status');
    return response.data.data;
  },

  // 触发挖矿竞争
  startMiningCompetition: async (): Promise<{
    success: boolean;
    message: string;
    miners: number;
    pendingTransactions: number;
  }> => {
    const response = await api.post('/mining/competition/start');
    return response.data;
  },
};

export { blockchainApi as default };