# 模拟区块链项目

这是一个完整的区块链模拟系统，包含后端API和前端界面，实现了基本的区块链功能。

## 功能特性

### 后端功能 (Node.js)
- ✅ **基本区块链类和区块结构** - 实现了完整的区块链数据结构
- ✅ **代币生产功能** - 支持代币铸造
- ✅ **用户创建和管理** - 账户系统
- ✅ **代币转账功能** - 支持账户间转账
- ✅ **矿工挖矿功能** - 工作量证明挖矿
- ✅ **区块链浏览器API** - 查看区块和交易信息

### 前端功能 (React + TypeScript + Tailwind CSS)
- ✅ **区块链浏览器界面** - 实时查看区块链状态
- ✅ **账户管理** - 创建和管理用户账户
- ✅ **交易管理** - 创建转账交易和铸币
- ✅ **挖矿界面** - 矿工挖矿操作
- ✅ **CosmJS集成演示** - Cosmos SDK 相关功能演示

## 项目结构

```
blockchain/
├── backend/                 # 后端服务
│   ├── package.json
│   ├── index.js            # 主服务器文件
│   └── blockchain.js       # 区块链核心逻辑
└── frontend/               # 前端应用
    ├── package.json
    ├── src/
    │   ├── components/     # React组件
    │   ├── services/       # API和服务
    │   └── App.tsx         # 主应用组件
    └── ...
```

## 安装和运行

### 1. 启动后端服务

```bash
cd backend
npm install
npm start
```

后端服务将在 `http://localhost:3001` 启动

### 2. 启动前端应用

```bash
cd frontend
npm install
npm run dev
```

前端应用将在 `http://localhost:5173` 启动

## API 接口文档

### 区块链信息
- `GET /api/blockchain/info` - 获取区块链基本信息
- `GET /api/blockchain/validate` - 验证区块链完整性

### 区块管理
- `GET /api/blocks` - 获取所有区块
- `GET /api/blocks/:index` - 获取特定区块

### 账户管理
- `POST /api/accounts` - 创建新账户
- `GET /api/accounts` - 获取所有账户
- `GET /api/accounts/:address/balance` - 获取账户余额

### 交易管理
- `POST /api/transactions` - 创建交易
- `GET /api/transactions/pending` - 获取待处理交易

### 挖矿
- `POST /api/mine` - 挖矿操作

### 代币管理
- `POST /api/tokens/mint` - 铸造代币

## 使用说明

### 1. 创建账户
在"账户管理"页面创建新的用户账户，可以手动输入地址或随机生成。

### 2. 铸造代币
在"交易与挖矿"页面使用铸币功能为账户创建初始代币。

### 3. 挖矿确认
创建交易后，需要通过挖矿来确认交易。选择矿工账户进行挖矿操作。

### 4. 转账交易
在有代币余额的情况下，可以在账户间进行转账。

### 5. 查看区块链
在"区块链浏览器"页面查看所有区块和交易详情。

## CosmJS 集成

项目包含了 CosmJS 的演示功能，展示了：
- 地址生成和验证
- 消息签名
- 交易创建和广播（模拟）
- 工具函数使用

注意：CosmJS 部分是演示性实现，实际项目中需要连接到真实的 Cosmos 网络。

## 技术栈

### 后端
- Node.js
- Express.js
- crypto-js (哈希和签名)
- uuid (唯一标识符)
- cors (跨域支持)

### 前端
- React 18
- TypeScript
- Tailwind CSS
- Vite (构建工具)
- Axios (HTTP 客户端)
- @cosmjs/stargate, @cosmjs/amino, @cosmjs/crypto

## 注意事项

1. **仅用于学习目的** - 这是一个简化的区块链实现，不适用于生产环境
2. **数据不持久化** - 重启后端服务将丢失所有数据
3. **简化的安全机制** - 使用了简化的签名和验证机制
4. **本地开发** - 默认配置适用于本地开发环境

## 常见问题

### Tailwind CSS PostCSS 错误
如果遇到 `[postcss] It looks like you're trying to use tailwindcss directly as a PostCSS plugin` 错误，请确保已安装 `@tailwindcss/postcss`：

```bash
cd fronend
npm install -D @tailwindcss/postcss
```

### Node.js 版本警告
项目使用 Vite 7.x，建议使用 Node.js 20.19+ 或 22.12+ 版本，但在 20.16.0 上也能正常运行。

## 扩展功能建议

- [ ] 数据库持久化存储
- [ ] 更复杂的共识算法
- [ ] 网络节点通信
- [ ] 智能合约支持
- [ ] 更完善的加密和安全机制
- [ ] 真实的 Cosmos SDK 集成

## 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！