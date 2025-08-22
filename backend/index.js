const express = require('express');
const cors = require('cors');
const { Blockchain, Transaction } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const blockchain = new Blockchain();

app.get('/api/blockchain/info', (req, res) => {
    try {
        const info = blockchain.getBlockchainInfo();
        res.json({ success: true, data: info });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/blocks', (req, res) => {
    try {
        const blocks = blockchain.getAllBlocks();
        res.json({ success: true, data: blocks });
    } catch (error) {
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