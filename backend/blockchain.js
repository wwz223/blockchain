/**
 * 🔐 区块链核心库
 * 本文件实现了一个教学用的简化区块链，包含以下Web3核心概念：
 * - 交易(Transaction): 代币转账记录
 * - 区块(Block): 包含多个交易的数据容器
 * - 区块链(Blockchain): 由区块组成的不可篡改链条
 * - 工作量证明(Proof of Work): 挖矿共识机制
 * - 数字签名: 交易安全验证
 */

const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');

/**
 * 📝 交易类 (Transaction)
 * Web3核心概念：每笔交易都记录了代币的转移信息
 * 就像银行转账记录一样，但是去中心化且不可篡改
 */
class Transaction {
    constructor(from, to, amount, type = 'transfer') {
        this.id = uuidv4();              // 📋 交易唯一标识符
        this.from = from;                // 💸 发送方地址 (null表示系统发放)
        this.to = to;                    // 💰 接收方地址
        this.amount = amount;            // 💎 转账金额
        this.type = type;                // 🏷️ 交易类型 (transfer/faucet/genesis)
        this.timestamp = Date.now();     // ⏰ 交易时间戳
        this.signature = null;           // ✍️ 数字签名 (确保交易真实性)
    }

    /**
     * 🔒 计算交易哈希值
     * Web3概念：哈希是区块链的指纹，任何数据改变都会产生完全不同的哈希
     * 用途：确保交易数据完整性，防止篡改
     */
    calculateHash() {
        return crypto.SHA256(this.from + this.to + this.amount + this.timestamp + this.type).toString();
    }

    /**
     * ✍️ 为交易添加数字签名
     * Web3概念：数字签名证明交易确实来自发送方
     * 就像现实中的签名一样，但更安全且无法伪造
     */
    signTransaction(signingKey) {
        const hashTx = this.calculateHash();
        this.signature = crypto.HmacSHA256(hashTx, signingKey).toString();
    }

    /**
     * ✅ 验证交易是否有效
     * Web3概念：验证数字签名确保交易真实性
     * 防止有人伪造交易或篡改交易数据
     */
    isValid() {
        // 系统交易(如创世交易)无需签名
        if (this.from === null) return true;
        
        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }
        
        // 重新计算签名进行验证
        const hashTx = this.calculateHash();
        const expectedSignature = crypto.HmacSHA256(hashTx, this.from).toString();
        return this.signature === expectedSignature;
    }
}

/**
 * 🧱 区块类 (Block) 
 * Web3核心概念：区块是交易的容器，像一页账本记录多笔交易
 * 每个区块都通过哈希值连接到前一个区块，形成不可篡改的链条
 */
class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;          // ⏰ 区块创建时间
        this.transactions = transactions;    // 📦 包含的所有交易
        this.previousHash = previousHash;    // 🔗 前一个区块的哈希(链接作用)
        this.hash = this.calculateHash();   // 🆔 当前区块的唯一哈希
        this.nonce = 0;                     // 🎲 挖矿随机数(POW核心)
        this.miner = null;                  // ⛏️ 挖出此区块的矿工地址
        this.reward = 0;                    // 💰 矿工获得的奖励金额
    }

    /**
     * 🔒 计算区块哈希值
     * Web3概念：包含所有区块数据的数字指纹
     * 任何数据改变(包括交易、时间、前置哈希)都会产生完全不同的哈希
     */
    calculateHash() {
        return crypto.SHA256(
            this.previousHash +              // 前一个区块哈希
            this.timestamp +                 // 时间戳
            JSON.stringify(this.transactions) + // 所有交易数据
            this.nonce +                     // 挖矿随机数
            (this.miner || '')              // 矿工地址
        ).toString();
    }

    /**
     * ⛏️ 挖矿函数 - 工作量证明(Proof of Work)的核心
     * Web3概念：矿工需要消耗计算力来找到符合要求的哈希值
     * 就像猜数字游戏，需要不断尝试直到找到正确答案
     * 
     * @param {number} difficulty - 挖矿难度(要求哈希开头有几个0)
     * @param {string} minerAddress - 矿工地址
     */
    mineBlock(difficulty, minerAddress) {
        // 🎯 目标：找到开头有N个0的哈希值 (N=difficulty)
        const target = Array(difficulty + 1).join("0");
        
        console.log(`⛏️ 开始挖矿... 目标哈希格式: ${target}xxxxxxxxxx`);
        
        // 🔄 不断尝试不同的nonce值，直到找到符合条件的哈希
        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;                    // 改变随机数
            this.hash = this.calculateHash(); // 重新计算哈希
            
            // 每尝试1000次打印一次进度(避免日志过多)
            if (this.nonce % 1000 === 0) {
                console.log(`🔍 尝试次数: ${this.nonce}, 当前哈希: ${this.hash.substring(0, 20)}...`);
            }
        }
        
        // 🎉 挖矿成功！
        this.miner = minerAddress;
        this.reward = 10;
        console.log(`✅ 挖矿成功! 区块哈希: ${this.hash}`);
        console.log(`🏆 矿工: ${minerAddress}, 获得奖励: ${this.reward} tokens`);
        console.log(`🎲 尝试次数: ${this.nonce}`);
    }

    /**
     * ✅ 验证区块内所有交易是否有效
     * Web3概念：确保区块内每笔交易都有有效的数字签名
     */
    hasValidTransactions() {
        for (const tx of this.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }
        return true;
    }
}

/**
 * ⛓️ 区块链类 (Blockchain) - 整个系统的核心
 * Web3核心概念：管理整条区块链，包括交易、挖矿、账户等所有功能
 * 就像一个去中心化的银行系统，但没有中央权威机构控制
 */
class Blockchain {
    constructor() {
        // 🏗️ 区块链基础设施
        this.chain = [this.createGenesisBlock()];  // 区块链条(从创世区块开始)
        this.difficulty = 2;                       // 挖矿难度(哈希开头需要几个0)
        this.pendingTransactions = [];             // 等待打包的交易池
        this.miningReward = 10;                    // 挖矿奖励(每个区块)
        this.accounts = new Map();                 // 账户数据库{地址: 账户信息}
        
        // ⚙️ POW(工作量证明)参数配置
        this.targetBlockTime = 10000;              // 🎯 目标出块时间：10秒
        this.difficultyAdjustmentInterval = 5;     // 🔧 每5个区块调整一次难度
        
        // 💧 水龙头系统配置(为新用户提供免费代币)
        this.faucetAmount = 100;                   // 💰 每次发放100代币
        this.faucetCooldown = 24 * 60 * 60 * 1000; // ⏰ 24小时冷却时间
        this.faucetHistory = new Map();            // 📝 使用历史记录
        this.faucetAddress = 'genesis';            // 💳 资金来源账户
        
        // ⛏️ 自动挖矿系统配置
        this.autoMining = false;                   // 🔄 自动挖矿开关
        this.miners = [];                          // 👥 活跃矿工列表
        this.miningInterval = null;                // ⏰ 挖矿定时器
        this.minTransactionsToMine = 1;            // 📦 触发挖矿的最小交易数
        this.maxBlockTime = 30000;                 // ⏱️ 最大区块间隔(30秒强制出块)
        this.lastBlockTime = Date.now();          // 🕒 上次出块时间
        
        // 📊 挖矿统计数据
        this.miningStats = {
            totalBlocksMined: 0,               // 📈 总挖出区块数
            totalRewardsPaid: 0,               // 💰 总奖励支付
            averageMiningTime: 0,              // ⏱️ 平均挖矿时间
            networkHashRate: 0                 // 🔥 网络算力
        };
        
        console.log('🚀 区块链系统初始化完成!');
        console.log(`📊 当前配置:`);
        console.log(`   - 挖矿难度: ${this.difficulty}`);
        console.log(`   - 出块时间: ${this.targetBlockTime/1000}秒`);
        console.log(`   - 挖矿奖励: ${this.miningReward} tokens`);
        console.log(`   - 水龙头: ${this.faucetAmount} tokens/天`);
        console.log(`   - 自动挖矿: ${this.autoMining ? '✅ 已启用' : '❌ 未启用'}`);
    }

    /**
     * 🌱 创建创世区块(Genesis Block)
     * Web3概念：区块链的第一个区块，包含初始代币供应
     * 就像铸造第一批硬币，建立整个经济系统的基础
     */
    createGenesisBlock() {
        console.log('🌱 创建创世区块...');
        const genesisTransaction = new Transaction(null, 'genesis', 1000000, 'genesis');
        const genesisBlock = new Block(Date.parse("2024-01-01"), [genesisTransaction], "0");
        console.log(`✅ 创世区块创建完成! 初始代币供应: 1,000,000 tokens`);
        return genesisBlock;
    }

    /**
     * 📄 获取最新区块
     * 返回区块链上的最后一个区块
     */
    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    /**
     * 🏠 生成区块链地址
     * Web3概念：就像银行账号，但是由密码学算法生成
     * 格式：0x + 40位十六进制字符 (类似以太坊地址)
     * 
     * @param {string|null} alias - 可选别名，用于生成更个性化的地址
     * @returns {string} 42位区块链地址 (0x开头)
     */
    generateAddress(alias = null) {
        const timestamp = Date.now();
        const randomBytes = Math.random().toString(36).substring(2);
        const input = `${alias || 'account'}_${timestamp}_${randomBytes}`;
        const hash = crypto.SHA256(input).toString();
        const address = '0x' + hash.substring(0, 40);
        
        console.log(`🏠 生成新地址: ${address}${alias ? ` (别名: ${alias})` : ''}`);
        return address;
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

    /**
     * 👥 矿工管理系统
     * Web3概念：真实区块链中，矿工是网络的维护者，自动参与挖矿竞争
     */

    /**
     * ➕ 添加矿工节点
     * @param {string} minerAddress - 矿工地址或别名
     * @param {boolean} autoStart - 是否自动开始挖矿
     */
    addMiner(minerAddress, autoStart = true) {
        const address = this.resolveAddress(minerAddress);
        
        if (!this.accounts.has(address)) {
            throw new Error('Invalid miner address');
        }

        if (!this.miners.includes(address)) {
            this.miners.push(address);
            console.log(`⛏️ 新矿工加入网络: ${minerAddress} (${address})`);
            
            if (autoStart && !this.autoMining) {
                this.startAutoMining();
            }
        }
        
        return address;
    }

    /**
     * ➖ 移除矿工节点
     * @param {string} minerAddress - 矿工地址或别名
     */
    removeMiner(minerAddress) {
        const address = this.resolveAddress(minerAddress);
        const index = this.miners.indexOf(address);
        
        if (index > -1) {
            this.miners.splice(index, 1);
            console.log(`🚪 矿工离开网络: ${minerAddress}`);
            
            if (this.miners.length === 0) {
                this.stopAutoMining();
            }
        }
    }

    /**
     * 🔄 启动自动挖矿系统
     * Web3概念：真实区块链网络中，挖矿是持续进行的
     * 矿工会自动监听新交易并开始挖矿竞争
     */
    startAutoMining() {
        if (this.autoMining) {
            console.log('⚠️ 自动挖矿已经在运行');
            return;
        }

        if (this.miners.length === 0) {
            console.log('❌ 没有活跃矿工，无法启动自动挖矿');
            return;
        }

        this.autoMining = true;
        console.log('🟢 启动自动挖矿系统');
        console.log(`👥 活跃矿工: ${this.miners.length} 个`);
        
        // 定期检查是否需要挖矿
        this.miningInterval = setInterval(() => {
            this.checkAndMine();
        }, 5000); // 每5秒检查一次

        this.lastBlockTime = Date.now();
    }

    /**
     * ⏹️ 停止自动挖矿系统
     */
    stopAutoMining() {
        if (!this.autoMining) {
            return;
        }

        this.autoMining = false;
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
        
        console.log('🔴 自动挖矿系统已停止');
    }

    /**
     * 🔍 检查并执行挖矿
     * Web3概念：矿工持续监控交易池，满足条件时自动开始挖矿
     */
    checkAndMine() {
        if (!this.autoMining || this.miners.length === 0) {
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastBlock = currentTime - this.lastBlockTime;
        
        // 触发挖矿的条件
        const hasEnoughTransactions = this.pendingTransactions.length >= this.minTransactionsToMine;
        const timeoutReached = timeSinceLastBlock >= this.maxBlockTime;
        
        if (hasEnoughTransactions || timeoutReached) {
            if (hasEnoughTransactions) {
                console.log(`🎯 检测到 ${this.pendingTransactions.length} 笔待处理交易，触发自动挖矿`);
            } else if (timeoutReached) {
                console.log(`⏰ 距离上次出块已 ${Math.round(timeSinceLastBlock/1000)} 秒，强制出块`);
            }

            this.startMiningCompetition();
        }
    }

    /**
     * 🏁 开始挖矿竞争
     * Web3概念：多个矿工同时竞争挖矿，最快找到答案的获得奖励
     * 在真实网络中，这是通过P2P网络协调的
     */
    startMiningCompetition() {
        if (this.pendingTransactions.length === 0) {
            console.log('📦 交易池为空，跳过挖矿');
            return;
        }

        // 随机选择一个矿工 (简化的竞争机制)
        // 真实网络中是算力竞争，算力越强获胜概率越高
        const randomIndex = Math.floor(Math.random() * this.miners.length);
        const winnerMiner = this.miners[randomIndex];
        
        console.log(`🎲 挖矿竞争开始! 参与矿工: ${this.miners.length} 个`);
        console.log(`🏆 竞争胜出: ${winnerMiner}`);

        // 执行挖矿
        try {
            this.minePendingTransactions(winnerMiner);
            this.lastBlockTime = Date.now();
            
            // 通知所有矿工新区块已产生
            this.broadcastNewBlock();
            
        } catch (error) {
            console.error('❌ 自动挖矿失败:', error.message);
        }
    }

    /**
     * 📡 广播新区块
     * Web3概念：新区块挖出后，需要广播给网络中的所有节点
     * 在真实网络中通过P2P协议实现
     */
    broadcastNewBlock() {
        const latestBlock = this.getLatestBlock();
        console.log('📡 向网络广播新区块:');
        console.log(`   - 区块高度: ${this.chain.length}`);
        console.log(`   - 区块哈希: ${latestBlock.hash.substring(0, 20)}...`);
        console.log(`   - 包含交易: ${latestBlock.transactions.length} 笔`);
        console.log(`   - 矿工奖励: ${latestBlock.reward} tokens`);
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

    // ============================================
    // 🤖 自动挖矿系统 (Automatic Mining System)
    // ============================================

    /**
     * 🚀 启动自动挖矿系统
     * Web3概念：真实区块链网络中，矿工节点会自动检测交易并开始挖矿竞争
     * 这里模拟了这个过程：系统自动检测待处理交易，并触发多个矿工的竞争挖矿
     */
    startAutoMining(config = {}) {
        if (this.autoMining) {
            return { success: false, error: 'Auto mining is already running' };
        }

        // 📊 配置自动挖矿参数
        this.autoMineInterval = config.autoMineInterval || 10000;      // 每10秒检查一次
        this.minTransactionsToMine = config.minTransactionsToMine || 1; // 最少1笔交易触发挖矿
        this.maxBlockTime = config.maxBlockTime || 30000;              // 30秒强制出块

        this.autoMining = true;
        console.log('🤖 自动挖矿系统启动成功!');
        console.log(`   ⏰ 检查间隔: ${this.autoMineInterval/1000}秒`);
        console.log(`   📦 触发条件: ${this.minTransactionsToMine}笔交易`);
        console.log(`   ⏱️ 强制出块: ${this.maxBlockTime/1000}秒`);

        // 🔄 启动定期检查
        this.miningInterval = setInterval(() => {
            this.checkAndStartMining();
        }, this.autoMineInterval);

        return {
            success: true,
            config: {
                autoMineInterval: this.autoMineInterval,
                minTransactionsToMine: this.minTransactionsToMine,
                maxBlockTime: this.maxBlockTime,
                totalMiners: this.miners.length
            }
        };
    }

    /**
     * ⏹️ 停止自动挖矿系统
     */
    stopAutoMining() {
        if (!this.autoMining) {
            return { success: false, error: 'Auto mining is not running' };
        }

        this.autoMining = false;
        
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }

        console.log('⏹️ 自动挖矿系统已停止');

        return {
            success: true,
            stats: {
                totalBlocksMined: this.miningStats.totalBlocksMined,
                totalRewardsPaid: this.miningStats.totalRewardsPaid,
                averageMiningTime: this.miningStats.averageMiningTime
            }
        };
    }

    /**
     * 👥 添加矿工到挖矿网络
     * Web3概念：在真实区块链中，任何人都可以成为矿工，运行挖矿软件参与网络
     */
    addMiner(minerAddress, hashPower = 1.0) {
        // 🔍 解析地址或别名
        const resolvedAddress = this.resolveAddress(minerAddress);
        if (!resolvedAddress) {
            return { success: false, error: 'Address not found' };
        }

        // 📋 检查是否已经是矿工
        const existingMiner = this.miners.find(m => m.address === resolvedAddress);
        if (existingMiner) {
            return { success: false, error: 'Address is already a miner' };
        }

        // ➕ 添加新矿工
        const miner = {
            address: resolvedAddress,
            alias: this.accounts.get(resolvedAddress)?.alias || null,
            hashPower: Math.max(0.1, Math.min(10.0, hashPower)), // 限制在0.1-10倍之间
            isActive: true,
            joinedAt: Date.now(),
            blocksMined: 0,
            totalRewards: 0
        };

        this.miners.push(miner);
        console.log(`👥 新矿工加入网络: ${miner.alias || miner.address} (算力: ${miner.hashPower}x)`);

        return { success: true, miner };
    }

    /**
     * 👋 移除矿工从挖矿网络
     */
    removeMiner(minerAddress) {
        const resolvedAddress = this.resolveAddress(minerAddress);
        if (!resolvedAddress) {
            return { success: false, error: 'Address not found' };
        }

        const minerIndex = this.miners.findIndex(m => m.address === resolvedAddress);
        if (minerIndex === -1) {
            return { success: false, error: 'Address is not a miner' };
        }

        const removedMiner = this.miners.splice(minerIndex, 1)[0];
        console.log(`👋 矿工离开网络: ${removedMiner.alias || removedMiner.address}`);

        return { success: true };
    }

    /**
     * 📊 获取挖矿系统状态
     */
    getMiningStatus() {
        const lastBlock = this.getLatestBlock();
        const timeSinceLastBlock = Date.now() - lastBlock.timestamp;
        
        return {
            autoMining: this.autoMining,
            totalMiners: this.miners.length,
            miners: this.miners.map(m => ({
                address: m.address,
                alias: m.alias,
                hashPower: m.hashPower,
                isActive: m.isActive,
                blocksMined: m.blocksMined,
                totalRewards: m.totalRewards
            })),
            config: {
                autoMineInterval: this.autoMineInterval,
                minTransactionsToMine: this.minTransactionsToMine,
                maxBlockTime: this.maxBlockTime
            },
            stats: this.miningStats,
            lastBlockTime: lastBlock.timestamp,
            timeSinceLastBlock: timeSinceLastBlock,
            nextBlockEstimate: this.autoMining ? Math.max(0, this.maxBlockTime - timeSinceLastBlock) : null
        };
    }

    /**
     * 🏁 开始挖矿竞争
     * Web3概念：真实区块链中，多个矿工同时竞争解决数学难题，最快的获胜
     */
    startMiningCompetition() {
        if (this.miners.length === 0) {
            console.log('❌ 没有矿工可以参与竞争');
            return;
        }

        if (this.pendingTransactions.length === 0) {
            console.log('❌ 没有待处理交易，跳过挖矿');
            return;
        }

        console.log(`🏁 挖矿竞争开始! 参与矿工: ${this.miners.length}, 待处理交易: ${this.pendingTransactions.length}`);

        // 🎲 根据算力权重随机选择获胜矿工
        // 模拟真实POW中算力越高获胜概率越大
        const totalHashPower = this.miners.reduce((sum, miner) => sum + miner.hashPower, 0);
        const random = Math.random() * totalHashPower;
        
        let currentWeight = 0;
        let winningMiner = null;
        
        for (const miner of this.miners) {
            currentWeight += miner.hashPower;
            if (random <= currentWeight) {
                winningMiner = miner;
                break;
            }
        }

        if (winningMiner) {
            console.log(`🏆 矿工获胜: ${winningMiner.alias || winningMiner.address} (算力: ${winningMiner.hashPower}x)`);
            
            // ⛏️ 执行实际挖矿
            this.minePendingTransactions(winningMiner.address);
            
            // 📊 更新矿工统计
            winningMiner.blocksMined++;
            winningMiner.totalRewards += this.miningReward;
            
            // 📈 更新全局统计
            this.miningStats.totalBlocksMined++;
            this.miningStats.totalRewardsPaid += this.miningReward;
        }
    }

    /**
     * 🔍 检查是否需要开始挖矿
     */
    checkAndStartMining() {
        if (!this.autoMining) return;

        const lastBlock = this.getLatestBlock();
        const timeSinceLastBlock = Date.now() - lastBlock.timestamp;
        const hasEnoughTransactions = this.pendingTransactions.length >= this.minTransactionsToMine;
        const timeForced = timeSinceLastBlock >= this.maxBlockTime;

        if (hasEnoughTransactions || timeForced) {
            const reason = timeForced ? '⏰ 超时强制出块' : `📦 ${this.pendingTransactions.length}笔交易触发挖矿`;
            console.log(`🔍 ${reason}`);
            this.startMiningCompetition();
        }
    }
}

module.exports = { Blockchain, Transaction, Block };