/**
 * 🌐 区块链REST API服务器
 * 为Web3初学者提供完整的区块链交互接口
 * 
 * 功能包括：
 * - 📊 区块链状态查询
 * - 🏦 账户管理
 * - 💸 交易处理  
 * - ⛏️ 挖矿操作
 * - 💧 水龙头服务
 */

const express = require('express');
const cors = require('cors');
const { Blockchain, Transaction } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 3001;

// 🔧 中间件配置
app.use(cors());                    // 允许跨域请求(前端调用需要)
app.use(express.json());            // 解析JSON请求体

// 🏗️ 初始化区块链实例
const blockchain = new Blockchain();

// ============================================
// 📊 区块链信息查询 API
// ============================================

/**
 * GET /api/blockchain/info
 * 📋 获取区块链整体状态信息
 * 
 * 返回数据：
 * - height: 区块链高度(区块数量)
 * - difficulty: 当前挖矿难度
 * - consensusAlgorithm: 共识算法类型(POW)
 * - targetBlockTime: 目标出块时间(毫秒)
 * - miningReward: 挖矿奖励数量
 */
app.get('/api/blockchain/info', (req, res) => {
    try {
        const info = blockchain.getBlockchainInfo();
        console.log('📊 区块链信息查询:', info);
        res.json({ success: true, data: info });
    } catch (error) {
        console.error('❌ 获取区块链信息失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/blocks
 * 📦 获取所有区块信息
 * 
 * 返回数据：每个区块包含
 * - hash: 区块哈希值
 * - previousHash: 前一个区块哈希
 * - transactions: 包含的所有交易
 * - miner: 挖矿地址
 * - nonce: 挖矿随机数
 * - miningTime: 挖矿用时
 */
app.get('/api/blocks', (req, res) => {
    try {
        const blocks = blockchain.getAllBlocks();
        console.log(`📦 获取所有区块，共 ${blocks.length} 个区块`);
        res.json({ success: true, data: blocks });
    } catch (error) {
        console.error('❌ 获取区块失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/blocks/:index', (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const block = blockchain.getBlock(index);
        
        if (!block) {
            return res.status(404).json({ success: false, error: 'Block not found' });
        }
        
        res.json({ success: true, data: block });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/accounts', (req, res) => {
    try {
        const { alias, address } = req.body;
        
        if (!alias && !address) {
            return res.status(400).json({ success: false, error: 'Alias or address is required' });
        }
        
        let result;
        if (alias) {
            // 通过别名创建账户，自动生成地址
            result = blockchain.createAccount(alias, true);
        } else {
            // 直接使用提供的地址创建账户
            result = blockchain.createAccount(address, false);
        }
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Account created successfully', 
                address: result.address,
                alias: result.alias
            });
        } else {
            res.status(409).json({ success: false, error: result.error });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/accounts', (req, res) => {
    try {
        const accounts = blockchain.getAllAccounts();
        res.json({ success: true, data: accounts });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/accounts/:address/balance', (req, res) => {
    try {
        const { address } = req.params;
        const balance = blockchain.getAccountBalance(address);
        res.json({ success: true, data: { address, balance } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/transactions', (req, res) => {
    try {
        const { from, to, amount } = req.body;
        
        if (!from || !to || !amount) {
            return res.status(400).json({ 
                success: false, 
                error: 'From, to, and amount are required' 
            });
        }
        
        if (amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Amount must be positive' 
            });
        }
        
        const transaction = new Transaction(from, to, amount);
        blockchain.createTransaction(transaction);
        
        res.json({ 
            success: true, 
            message: 'Transaction created successfully',
            transactionId: transaction.id
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/transactions/pending', (req, res) => {
    try {
        res.json({ 
            success: true, 
            data: blockchain.pendingTransactions 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/mine', (req, res) => {
    try {
        const { minerAddress } = req.body;
        
        if (!minerAddress) {
            return res.status(400).json({ 
                success: false, 
                error: 'Miner address is required' 
            });
        }
        
        if (blockchain.pendingTransactions.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No pending transactions to mine' 
            });
        }
        
        blockchain.minePendingTransactions(minerAddress);
        
        const newBalance = blockchain.getAccountBalance(minerAddress);
        
        res.json({ 
            success: true, 
            message: 'Block mined successfully!',
            minerAddress,
            newBalance,
            blockHeight: blockchain.chain.length
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// 移除不合理的铸造API - 在真实区块链中，普通用户不应该能够随意铸造代币
// 代币的生成应该通过以下合理机制：
// 1. 创世区块的初始供应 (已实现)
// 2. 挖矿奖励 (已实现) 
// 3. 水龙头测试代币 (已实现)

app.get('/api/blockchain/validate', (req, res) => {
    try {
        const isValid = blockchain.isChainValid();
        res.json({ success: true, data: { isValid } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 水龙头相关API
app.get('/api/faucet/info', (req, res) => {
    try {
        const faucetInfo = blockchain.getFaucetInfo();
        res.json({ success: true, data: faucetInfo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/faucet/claim', (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address) {
            return res.status(400).json({ 
                success: false, 
                error: 'Address or alias is required' 
            });
        }

        // 检查是否可以使用水龙头
        const canUse = blockchain.canUseFaucet(address);
        if (!canUse.canUse) {
            return res.status(400).json({
                success: false,
                error: canUse.reason,
                remainingTime: canUse.remainingTime
            });
        }

        // 使用水龙头
        const result = blockchain.useFaucet(address);
        
        res.json({
            success: true,
            message: `Successfully claimed ${result.amount} tokens!`,
            ...result
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.get('/api/faucet/check/:address', (req, res) => {
    try {
        const { address } = req.params;
        const canUse = blockchain.canUseFaucet(address);
        
        res.json({
            success: true,
            data: canUse
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// ⛏️ 自动挖矿系统 API
// ============================================

/**
 * POST /api/mining/auto/start
 * 🚀 启动自动挖矿系统
 * 
 * 请求体：
 * - autoMineInterval: 自动挖矿检查间隔(毫秒，可选，默认10000)
 * - minTransactionsToMine: 触发挖矿的最小交易数(可选，默认1)
 * - maxBlockTime: 最大区块间隔，超时强制出块(毫秒，可选，默认30000)
 */
app.post('/api/mining/auto/start', (req, res) => {
    try {
        const { autoMineInterval = 10000, minTransactionsToMine = 1, maxBlockTime = 30000 } = req.body;
        
        const result = blockchain.startAutoMining({
            autoMineInterval,
            minTransactionsToMine,
            maxBlockTime
        });
        
        if (result.success) {
            console.log('🚀 自动挖矿系统已启动');
            res.json({
                success: true,
                message: 'Auto mining started successfully',
                config: result.config
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ 启动自动挖矿失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mining/auto/stop
 * ⏹️ 停止自动挖矿系统
 */
app.post('/api/mining/auto/stop', (req, res) => {
    try {
        const result = blockchain.stopAutoMining();
        
        console.log('⏹️ 自动挖矿系统已停止');
        res.json({
            success: true,
            message: 'Auto mining stopped successfully',
            stats: result.stats
        });
    } catch (error) {
        console.error('❌ 停止自动挖矿失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mining/miners/add
 * 👥 添加矿工到挖矿网络
 * 
 * 请求体：
 * - minerAddress: 矿工地址或别名
 * - hashPower: 算力权重(可选，默认1.0)
 */
app.post('/api/mining/miners/add', (req, res) => {
    try {
        const { minerAddress, hashPower = 1.0 } = req.body;
        
        if (!minerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Miner address is required'
            });
        }
        
        const result = blockchain.addMiner(minerAddress, hashPower);
        
        if (result.success) {
            console.log(`👥 矿工已加入网络: ${minerAddress} (算力: ${hashPower})`);
            res.json({
                success: true,
                message: 'Miner added successfully',
                miner: result.miner,
                totalMiners: blockchain.miners.length
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ 添加矿工失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * POST /api/mining/miners/remove
 * 👋 从挖矿网络移除矿工
 * 
 * 请求体：
 * - minerAddress: 矿工地址或别名
 */
app.post('/api/mining/miners/remove', (req, res) => {
    try {
        const { minerAddress } = req.body;
        
        if (!minerAddress) {
            return res.status(400).json({
                success: false,
                error: 'Miner address is required'
            });
        }
        
        const result = blockchain.removeMiner(minerAddress);
        
        if (result.success) {
            console.log(`👋 矿工已离开网络: ${minerAddress}`);
            res.json({
                success: true,
                message: 'Miner removed successfully',
                remainingMiners: blockchain.miners.length
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('❌ 移除矿工失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/mining/status
 * 📊 获取挖矿系统状态
 */
app.get('/api/mining/status', (req, res) => {
    try {
        const status = blockchain.getMiningStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('❌ 获取挖矿状态失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /api/mining/competition/start
 * 🏁 手动触发一次挖矿竞争(用于测试)
 */
app.post('/api/mining/competition/start', (req, res) => {
    try {
        if (blockchain.miners.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No miners available for competition'
            });
        }
        
        if (blockchain.pendingTransactions.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No pending transactions to mine'
            });
        }
        
        // 立即触发一次挖矿竞争
        blockchain.startMiningCompetition();
        
        res.json({
            success: true,
            message: 'Mining competition started',
            miners: blockchain.miners.length,
            pendingTransactions: blockchain.pendingTransactions.length
        });
    } catch (error) {
        console.error('❌ 启动挖矿竞争失败:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Blockchain API is running',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Blockchain server is running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    
    console.log('\n=== Creating initial test accounts ===');
    const user1 = blockchain.createAccount('user1', true);
    const user2 = blockchain.createAccount('user2', true);
    const miner1 = blockchain.createAccount('miner1', true);
    blockchain.createAccount('genesis', false);
    
    console.log('Initial accounts created:');
    console.log(`- user1 (alias): ${user1.address}`);
    console.log(`- user2 (alias): ${user2.address}`);
    console.log(`- miner1 (alias): ${miner1.address}`);
    console.log(`Genesis block balance available: ${blockchain.getAccountBalance('genesis')}`);
});