"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Save, Trash2, Power, RefreshCw, Files, Flame } from 'lucide-react';

export default function PrintAdmin() {
  const [adminPass, setAdminPass] = useState("");
  const [isLogged, setIsLogged] = useState(false);
  const [status, setStatus] = useState({ isMaintenance: false, fileCount: 0, passcodes: "" });
  const [message, setMessage] = useState("");

  const fetchStatus = async () => {
    const res = await fetch('/api/admin', { 
      headers: { 'Authorization': `Bearer ${adminPass}` } 
    });
    if (res.ok) {
      const data = await res.json();
      setStatus(data);
      setIsLogged(true);
    } else {
      setMessage("超級密碼錯誤");
    }
  };

  const handleAction = async (action: string, payload?: any) => {
    setMessage("執行中...");
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminPass}` },
      body: JSON.stringify({ action, payload })
    });
    const data = await res.json();
    
    // 關鍵修正：先等待資料狀態更新完成
    await fetchStatus(); 
    
    // 等狀態更新完，最後再把 API 回傳的「成功訊息」印在畫面上
    setMessage(data.message || data.error); 
  };

  if (!isLogged) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white font-mono">
        <ShieldAlert className="w-16 h-16 text-yellow-500 mb-6" />
        <h1 className="text-xl mb-4">PRINT ADMIN SYSTEM</h1>
        <input 
          type="password" 
          placeholder="Password" 
          className="bg-gray-900 border border-gray-700 p-3 rounded mb-4 text-center"
          onChange={(e) => setAdminPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setMessage("連線驗證中...");
              fetchStatus();
            }
          }}
        />
        <p className="text-red-400 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center p-6 text-white font-mono">
      <div className="w-full max-w-2xl bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
        <h1 className="text-2xl text-yellow-500 mb-8 flex items-center gap-2"><Power /> 列印系統總管理處</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* 維護模式開關 */}
          <div className={`p-6 rounded-xl border flex flex-col justify-between ${status.isMaintenance ? 'bg-red-950/30 border-red-800' : 'bg-gray-950 border-gray-800'}`}>
            <span className="text-gray-400 text-sm">服務狀態</span>
            <div className="flex justify-between items-end mt-2">
              <span className={`text-xl font-bold ${status.isMaintenance ? 'text-red-500' : 'text-green-500'}`}>
                {status.isMaintenance ? '🛠️ 緊急停機中' : '✅ 正常運作'}
              </span>
              <button onClick={() => handleAction('toggle_maintenance')} className={`p-2 rounded font-bold transition-all ${status.isMaintenance ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
                {status.isMaintenance ? '恢復服務' : '緊急停機'}
              </button>
            </div>
          </div>

          {/* 暫存檔案管理 */}
          <div className="p-6 bg-gray-950 rounded-xl border border-gray-800 flex flex-col justify-between">
            <span className="text-gray-400 text-sm">暫存區檔案數</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-xl font-bold text-yellow-500">{status.fileCount} 份文件</span>
              <button onClick={() => handleAction('clear_uploads')} className="p-2 bg-gray-800 hover:bg-red-900 rounded transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* 核彈按鈕：清空列印程序 */}
        <div className="mb-8 p-4 bg-red-950/20 border border-red-900/50 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-red-400 font-bold">卡紙排障專用</h3>
            <p className="text-xs text-gray-500">當印表機卡紙後，按下此鈕可終止主機端所有的 PDF 傳送程序。</p>
          </div>
          <button onClick={() => handleAction('kill_spooler')} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all">
            <Flame size={18} /> 清空列印程序
          </button>
        </div>

        {/* 授權密碼管理 */}
        <div className="mb-6">
          <label className="text-gray-400 text-sm block mb-2 flex items-center gap-2"><Files size={14}/> 列印授權密碼本</label>
          <textarea 
            rows={5}
            value={status.passcodes}
            onChange={(e) => setStatus({...status, passcodes: e.target.value})}
            className="w-full bg-gray-950 border border-gray-700 p-4 rounded-xl text-white font-mono text-lg focus:outline-none focus:border-yellow-500 transition-all"
            placeholder="一行一個密碼..."
          />
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => handleAction('update_passcodes', status.passcodes)} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-black py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all">
            <Save size={20}/> 儲存並更新密碼本
          </button>
          <button 
            onClick={() => {
              setMessage("資料同步中...");
              fetchStatus().then(() => setMessage("資料已同步"));
            }} 
            className="px-6 bg-gray-800 hover:bg-gray-700 py-4 rounded-xl transition-all"
          >
            <RefreshCw size={20}/>
          </button>
        </div>
        
        {/* 狀態訊息顯示區 */}
        <div className="mt-6 h-6 flex justify-center items-center">
          <p className="text-sm font-bold text-yellow-500 animate-pulse">{message}</p>
        </div>
      </div>
    </div>
  );
}