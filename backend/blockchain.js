const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

class Transaction {
    constructor(from, to, amount, type = 'transfer') {
        this.id = uuidv4();
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.type = type;
        this.timestamp = Date.now();
        this.signature = null;
    }

    calculateHash() {
        return crypto.SHA256(this.from + this.to + this.amount + this.timestamp + this.type).toString();
    }

    signTransaction(signingKey) {
        const hashTx = this.calculateHash();
        this.signature = crypto.HmacSHA256(hashTx, signingKey).toString();
    }

    isValid() {
        if (this.from === null) return true;
        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }
        const hashTx = this.calculateHash();
        const expectedSignature = crypto.HmacSHA256(hashTx, this.from).toString();
        return this.signature === expectedSignature;
    }
}

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.hash = this.calculateHash();
        this.nonce = 0;
        this.miner = null;
        this.reward = 0;
    }

    calculateHash() {
        return crypto.SHA256(
            this.previousHash + 
            this.timestamp + 
            JSON.stringify(this.transactions) + 
            this.nonce +
            (this.miner || '')
        ).toString();
    }

    mineBlock(difficulty, minerAddress) {
        const target = Array(difficulty + 1).join("0");
        
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();
        }
        
        this.miner = minerAddress;
        this.reward = 10;
        console.log(`Block mined: ${this.hash} by ${minerAddress}`);
    }

    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 10;
        this.accounts = new Map();
        this.targetBlockTime = 10000; // 目标出块时间：10秒
        this.difficultyAdjustmentInterval = 5; // 每5个区块调整一次难度
        
        // 水龙头配置
        this.faucetAmount = 100; // 每次水龙头发放100代币
        this.faucetCooldown = 24 * 60 * 60 * 1000; // 24小时冷却时间
        this.faucetHistory = new Map(); // 记录水龙头使用历史 {address: lastUsedTime}
        this.faucetAddress = 'genesis'; // 水龙头资金来源
    }

    createGenesisBlock() {
        const genesisTransaction = new Transaction(null, 'genesis', 1000000, 'genesis');
        return new Block(Date.parse("2024-01-01"), [genesisTransaction], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    // 生成区块链地址（哈希值）
    generateAddress(alias = null) {
        const timestamp = Date.now();
        const randomBytes = Math.random().toString(36).substring(2);
        const input = `${alias || 'account'}_${timestamp}_${randomBytes}`;
        const hash = crypto.SHA256(input).toString();
        return '0x' + hash.substring(0, 40); // 42位地址（包含0x前缀）
    }

    createAccount(aliasOrAddress, isAlias = true) {
        let address, alias;
        
        if (isAlias) {
            // 如果提供的是别名，生成真实地址
            alias = aliasOrAddress;
            address = this.generateAddress(alias);
        } else {
            // 如果提供的是地址，直接使用
            address = aliasOrAddress;
            alias = null;
        }

        if (!this.accounts.has(address)) {
            this.accounts.set(address, {
                address: address,
                alias: alias,
                balance: 0,
                transactions: [],
                createdAt: Date.now()
            });
            return { success: true, address, alias };
        }
        return { success: false, error: 'Account already exists' };
    }

    // 通过别名或地址查找账户
    findAccount(aliasOrAddress) {
        // 先尝试直接通过地址查找
        if (this.accounts.has(aliasOrAddress)) {
            return this.accounts.get(aliasOrAddress);
        }
        
        // 再尝试通过别名查找
        for (const [address, account] of this.accounts.entries()) {
            if (account.alias === aliasOrAddress) {
                return account;
            }
        }
        
        return null;
    }

    // 获取真实地址（支持别名转换）
    resolveAddress(aliasOrAddress) {
        const account = this.findAccount(aliasOrAddress);
        return account ? account.address : aliasOrAddress;
    }

    getAccountBalance(aliasOrAddress) {
        const address = this.resolveAddress(aliasOrAddress);
        if (!this.accounts.has(address)) {
            return 0;
        }
        
        let balance = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.from === address) {
                    balance -= trans.amount;
                }
                if (trans.to === address) {
                    balance += trans.amount;
                }
            }
            
            if (block.miner === address) {
                balance += block.reward;
            }
        }

        return balance;
    }

    createTransaction(transaction) {
        if (!transaction.from || !transaction.to) {
            throw new Error('Transaction must include from and to address');
        }

        // 解析实际地址
        const fromAddress = this.resolveAddress(transaction.from);
        const toAddress = this.resolveAddress(transaction.to);

        if (!this.accounts.has(fromAddress) || !this.accounts.has(toAddress)) {
            throw new Error('Invalid account address');
        }

        const balance = this.getAccountBalance(transaction.from);
        if (balance < transaction.amount) {
            throw new Error('Not enough balance');
        }

        // 使用真实地址更新交易
        transaction.from = fromAddress;
        transaction.to = toAddress;
        transaction.signTransaction(fromAddress);
        this.pendingTransactions.push(transaction);
    }

    // POW难度调整机制
    adjustDifficulty() {
        if (this.chain.length < this.difficultyAdjustmentInterval) {
            return; // 区块数量不足，无需调整
        }

        const lastBlock = this.getLatestBlock();
        const adjustmentBlock = this.chain[this.chain.length - this.difficultyAdjustmentInterval];
        
        if (!adjustmentBlock.miningTime || !lastBlock.miningTime) {
            return; // 缺少挖矿时间数据
        }

        // 计算最近几个区块的平均挖矿时间
        let totalMiningTime = 0;
        let count = 0;
        
        for (let i = this.chain.length - this.difficultyAdjustmentInterval; i < this.chain.length; i++) {
            if (this.chain[i].miningTime) {
                totalMiningTime += this.chain[i].miningTime;
                count++;
            }
        }

        if (count === 0) return;

        const averageMiningTime = totalMiningTime / count;
        const timeRatio = averageMiningTime / this.targetBlockTime;

        console.log(`Average mining time: ${averageMiningTime}ms, Target: ${this.targetBlockTime}ms, Ratio: ${timeRatio.toFixed(2)}`);

        // 调整难度
        if (timeRatio < 0.5) {
            // 挖矿太快，增加难度
            this.difficulty++;
            console.log(`Difficulty increased to ${this.difficulty}`);
        } else if (timeRatio > 2.0) {
            // 挖矿太慢，降低难度
            this.difficulty = Math.max(1, this.difficulty - 1);
            console.log(`Difficulty decreased to ${this.difficulty}`);
        }
    }

    minePendingTransactions(miningRewardAddress) {
        const resolvedAddress = this.resolveAddress(miningRewardAddress);
        if (!this.accounts.has(resolvedAddress)) {
            throw new Error('Invalid miner address');
        }

        // POW: 调整挖矿难度
        this.adjustDifficulty();

        // POW: 只通过区块奖励给矿工，不创建额外的奖励交易
        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        const startTime = Date.now();
        block.mineBlock(this.difficulty, resolvedAddress);
        const endTime = Date.now();
        
        // 记录挖矿统计信息
        block.miningTime = endTime - startTime;
        block.hashRate = block.nonce / (block.miningTime / 1000); // hashes per second

        console.log(`Block successfully mined in ${block.miningTime}ms! Hash rate: ${block.hashRate.toFixed(2)} H/s`);
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    // 水龙头功能：检查用户是否可以使用水龙头
    canUseFaucet(aliasOrAddress) {
        const address = this.resolveAddress(aliasOrAddress);
        
        if (!this.accounts.has(address)) {
            return { canUse: false, reason: 'Account not found' };
        }

        const lastUsedTime = this.faucetHistory.get(address);
        if (!lastUsedTime) {
            return { canUse: true, reason: 'First time use' };
        }

        const timeSinceLastUse = Date.now() - lastUsedTime;
        if (timeSinceLastUse >= this.faucetCooldown) {
            return { canUse: true, reason: 'Cooldown expired' };
        }

        const remainingTime = this.faucetCooldown - timeSinceLastUse;
        const hours = Math.ceil(remainingTime / (60 * 60 * 1000));
        return { 
            canUse: false, 
            reason: `Please wait ${hours} hours before using faucet again`,
            remainingTime: remainingTime
        };
    }

    // 水龙头功能：发放代币
    useFaucet(aliasOrAddress) {
        const address = this.resolveAddress(aliasOrAddress);
        
        // 检查是否可以使用
        const canUseResult = this.canUseFaucet(aliasOrAddress);
        if (!canUseResult.canUse) {
            throw new Error(canUseResult.reason);
        }

        // 检查水龙头余额
        const faucetBalance = this.getAccountBalance(this.faucetAddress);
        if (faucetBalance < this.faucetAmount) {
            throw new Error('Faucet is empty, please contact administrator');
        }

        // 创建水龙头交易
        const faucetTransaction = new Transaction(
            this.faucetAddress, 
            address, 
            this.faucetAmount, 
            'faucet'
        );
        
        // 记录使用时间
        this.faucetHistory.set(address, Date.now());
        
        // 添加到待处理交易
        this.pendingTransactions.push(faucetTransaction);

        return {
            success: true,
            amount: this.faucetAmount,
            transactionId: faucetTransaction.id,
            recipient: address
        };
    }

    // 获取水龙头信息
    getFaucetInfo() {
        const faucetBalance = this.getAccountBalance(this.faucetAddress);
        return {
            faucetAmount: this.faucetAmount,
            faucetBalance: faucetBalance,
            cooldownHours: this.faucetCooldown / (60 * 60 * 1000),
            totalClaims: this.faucetHistory.size
        };
    }

    isChainValid() {
        const realGenesis = JSON.stringify(this.createGenesisBlock());

        if (realGenesis !== JSON.stringify(this.chain[0])) {
            return false;
        }

        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (previousBlock.hash !== currentBlock.previousHash) {
                return false;
            }

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }
        }

        return true;
    }

    getAllAccounts() {
        const accounts = [];
        for (const [address, account] of this.accounts.entries()) {
            accounts.push({
                ...account,
                balance: this.getAccountBalance(address)
            });
        }
        return accounts;
    }

    getBlockchainInfo() {
        return {
            height: this.chain.length,
            difficulty: this.difficulty,
            totalTransactions: this.chain.reduce((sum, block) => sum + block.transactions.length, 0),
            totalAccounts: this.accounts.size,
            pendingTransactions: this.pendingTransactions.length,
            targetBlockTime: this.targetBlockTime,
            difficultyAdjustmentInterval: this.difficultyAdjustmentInterval,
            miningReward: this.miningReward,
            consensusAlgorithm: 'POW'
        };
    }

    getBlock(index) {
        if (index >= 0 && index < this.chain.length) {
            return this.chain[index];
        }
        return null;
    }

    getAllBlocks() {
        return this.chain.map((block, index) => ({
            index,
            hash: block.hash,
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            transactions: block.transactions,
            miner: block.miner,
            reward: block.reward,
            nonce: block.nonce,
            miningTime: block.miningTime || 0,
            hashRate: block.hashRate || 0
        }));
    }
}

module.exports = { Blockchain, Transaction, Block };