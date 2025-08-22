import React, { useState } from 'react';
import { cosmjsClient, cosmjsUtils } from '../services/cosmjs';

const CosmjsDemo: React.FC = () => {
  const [generatedAddress, setGeneratedAddress] = useState('');
  const [addressToValidate, setAddressToValidate] = useState('');
  const [validationResult, setValidationResult] = useState<boolean | null>(null);
  const [messageToSign, setMessageToSign] = useState('');
  const [signature, setSignature] = useState('');
  const [txHash, setTxHash] = useState('');

  const handleGenerateAddress = () => {
    const address = cosmjsClient.generateAddress('cosmos');
    setGeneratedAddress(address);
  };

  const handleValidateAddress = () => {
    const isValid = cosmjsClient.validateAddress(addressToValidate);
    setValidationResult(isValid);
  };

  const handleSignMessage = () => {
    if (!messageToSign.trim()) return;
    
    const sig = cosmjsClient.signMessage(messageToSign);
    setSignature(sig);
  };

  const handleCreateMockTx = async () => {
    const fromAddr = cosmjsClient.generateAddress('cosmos');
    const toAddr = cosmjsClient.generateAddress('cosmos');
    
    const tx = cosmjsClient.createSendTx(fromAddr, toAddr, '1000000', 'utoken');
    const mockTxBytes = new TextEncoder().encode(JSON.stringify(tx));
    
    try {
      const result = await cosmjsClient.broadcastTx(mockTxBytes);
      setTxHash(result.transactionHash);
    } catch (error) {
      console.error('Mock transaction failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">CosmJS 演示功能</h2>
        <p className="text-gray-600 mb-6">
          这里展示了 CosmJS 的一些基本功能。注意：这是模拟实现，用于演示目的。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 地址生成 */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">地址生成</h3>
            <button
              onClick={handleGenerateAddress}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-3"
            >
              生成 Cosmos 地址
            </button>
            {generatedAddress && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">生成的地址:</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {generatedAddress}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  格式化显示: {cosmjsUtils.formatAddress(generatedAddress)}
                </p>
              </div>
            )}
          </div>

          {/* 地址验证 */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">地址验证</h3>
            <input
              type="text"
              value={addressToValidate}
              onChange={(e) => setAddressToValidate(e.target.value)}
              placeholder="输入要验证的地址"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            />
            <button
              onClick={handleValidateAddress}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              验证地址
            </button>
            {validationResult !== null && (
              <div className={`mt-2 p-2 rounded ${
                validationResult 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                地址 {validationResult ? '有效' : '无效'}
              </div>
            )}
          </div>

          {/* 消息签名 */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">消息签名</h3>
            <input
              type="text"
              value={messageToSign}
              onChange={(e) => setMessageToSign(e.target.value)}
              placeholder="输入要签名的消息"
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
            />
            <button
              onClick={handleSignMessage}
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              签名消息
            </button>
            {signature && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">签名结果:</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {signature}
                </p>
              </div>
            )}
          </div>

          {/* 模拟交易 */}
          <div className="border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">模拟交易广播</h3>
            <p className="text-sm text-gray-600 mb-3">
              创建并广播一个模拟的发送交易
            </p>
            <button
              onClick={handleCreateMockTx}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              创建模拟交易
            </button>
            {txHash && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">交易哈希:</p>
                <p className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {txHash}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 工具函数演示 */}
        <div className="mt-6 border p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">工具函数演示</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold">金额转换示例:</p>
              <p>1000000 utoken = {cosmjsUtils.fromMicroDenom('1000000')} token</p>
              <p>1 token = {cosmjsUtils.toMicroDenom('1')} utoken</p>
            </div>
            <div>
              <p className="font-semibold">数量验证:</p>
              <p>"123.45" 是否有效: {cosmjsUtils.validateAmount('123.45') ? '是' : '否'}</p>
              <p>"-10" 是否有效: {cosmjsUtils.validateAmount('-10') ? '是' : '否'}</p>
              <p>"abc" 是否有效: {cosmjsUtils.validateAmount('abc') ? '是' : '否'}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>注意:</strong> 这些是模拟的 CosmJS 功能实现，仅用于演示目的。
            在实际项目中，您需要连接到真实的 Cosmos 网络并使用真实的私钥进行签名。
          </p>
        </div>
      </div>
    </div>
  );
};

export default CosmjsDemo;