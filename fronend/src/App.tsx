import { useState, useEffect } from 'react'
import BlockchainExplorer from './components/BlockchainExplorer'
import AccountManager from './components/AccountManager'
import TransactionManager from './components/TransactionManager'
import AutoMiningManager from './components/AutoMiningManager'
import Faucet from './components/Faucet'
import CosmjsDemo from './components/CosmjsDemo'
import { blockchainApi } from './services/api'

function App() {
  const [activeTab, setActiveTab] = useState('explorer')
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking')

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await blockchainApi.healthCheck()
        setConnectionStatus('connected')
      } catch (err) {
        setConnectionStatus('disconnected')
      }
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'explorer', name: '区块链浏览器', component: BlockchainExplorer },
    { id: 'accounts', name: '账户管理', component: AccountManager },
    { id: 'faucet', name: '代币水龙头', component: Faucet },
    { id: 'transactions', name: '交易与挖矿', component: TransactionManager },
    { id: 'automining', name: '自动挖矿系统', component: AutoMiningManager },
    { id: 'cosmjs', name: 'CosmJS 演示', component: CosmjsDemo },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || BlockchainExplorer

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 头部导航 */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">模拟区块链</h1>
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
                connectionStatus === 'connected' 
                  ? 'bg-green-100 text-green-800'
                  : connectionStatus === 'disconnected'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' :
                  connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span>
                  {connectionStatus === 'connected' ? '已连接' : 
                   connectionStatus === 'disconnected' ? '未连接' : '检查中...'}
                </span>
              </div>
            </div>
          </div>

          {/* 标签导航 */}
          <div className="flex space-x-8 border-t">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        {connectionStatus === 'disconnected' ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">无法连接到后端服务</p>
            <p>请确保后端服务在 http://localhost:3001 上运行</p>
          </div>
        ) : (
          <ActiveComponent />
        )}
      </main>
    </div>
  )
}

export default App