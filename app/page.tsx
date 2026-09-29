// Copyright (c) 2026 HoneyDragon1016
//
// This file is part of print-web.
//
// print-web is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, version 3.
//
// COMMERCIAL USE:
// If you wish to use this software in a closed-source or commercial
// project, you must contact the author for a commercial license.
// Contact: <service@honeychen.uk>

"use client";

import { useState, useEffect } from "react";
import { Turnstile } from '@marsidev/react-turnstile';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // 👁️ 新增：預覽網址狀態
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [colorMode, setColorMode] = useState("color");
  const [orientation, setOrientation] = useState("portrait"); // 🔄 新增：直印/橫印狀態
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [lang, setLang] = useState<"zh" | "en">("zh");

  const t = {
    zh: {
      title: "自助列印服務",
      switchBtn: "EN",
      fileHint: "支援 PDF, JPG, PNG (最大 20MB)",
      fileSubHint: "上傳後可即時預覽",
      selected: "已選擇:",
      warnSizeTitle: "⚠️ 檔案超出 20MB 限制",
      warnSizeDesc: "請將檔案壓縮後再上傳。",
      color: "彩色",
      bw: "黑白",
      portrait: "直印",
      landscape: "橫印",
      passcode: "請輸入一次性授權碼",
      btnPrint: "確認授權並列印",
      btnProcessing: "處理中...",
      errEmpty: "請先選擇文件並輸入驗證碼",
      errTurnstile: "🛡️ 請先等待人機驗證完成",
      statusUploading: "驗證授權與檔案處理中...",
      statusSuccess: "✅ 列印任務已發送！",
      errPasscode: "❌ 密碼無效或已被使用",
      errServer: "❌ 伺服器錯誤",
      errConn: "❌ 連線伺服器失敗",
      errBot: "❌ 人機驗證失敗，請重整",
    },
    en: {
      title: "Self-Service Printing",
      switchBtn: "中文",
      fileHint: "PDF, JPG, PNG (Max 20MB)",
      fileSubHint: "Instant preview available after upload",
      selected: "Selected:",
      warnSizeTitle: "⚠️ File Exceeds 20MB",
      warnSizeDesc: "Please compress the file before uploading.",
      color: "Color",
      bw: "B&W",
      portrait: "Portrait",
      landscape: "Landscape",
      passcode: "Enter one-time passcode",
      btnPrint: "Verify & Print",
      btnProcessing: "Processing...",
      errEmpty: "Please select a file and enter passcode",
      errTurnstile: "🛡️ Please wait for security check",
      statusUploading: "Verifying and processing...",
      statusSuccess: "✅ Print job sent successfully!",
      errPasscode: "❌ Invalid or expired passcode",
      errServer: "❌ Server error",
      errConn: "❌ Failed to connect to server",
      errBot: "❌ Security check failed",
    }
  };

  // 👁️ 處理檔案選擇與產生預覽
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    // 清除舊的預覽 URL 避免記憶體洩漏
    if (previewUrl) URL.revokeObjectURL(previewUrl);

    if (selectedFile) {
      if (selectedFile.size > 20 * 1024 * 1024) {
        setShowSizeWarning(true);
        setFile(null);
        setPreviewUrl(null);
      } else {
        setShowSizeWarning(false);
        setFile(selectedFile);
        // 產生本地端預覽連結
        setPreviewUrl(URL.createObjectURL(selectedFile));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !passcode) {
      setStatus(t[lang].errEmpty);
      return;
    }
    if (!turnstileToken) {
      setStatus(t[lang].errTurnstile);
      return;
    }

    setUploading(true);
    setStatus(t[lang].statusUploading);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("passcode", passcode);
    formData.append("colorMode", colorMode);
    formData.append("orientation", orientation); // 🔄 將方向參數送往後端
    formData.append("cf-turnstile-response", turnstileToken);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus(t[lang].statusSuccess);
        setPasscode("");
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      } else {
        setStatus("❌ " + (data.error || "Error"));
      }
    } catch (error) {
      setStatus(t[lang].errConn);
    } finally {
      setUploading(false);
    }
  };

  const toggleLanguage = () => {
    setLang(lang === "zh" ? "en" : "zh");
    setStatus(""); 
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-800 relative">
        <button onClick={toggleLanguage} className="absolute top-6 right-6 px-3 py-1 bg-gray-800 hover:bg-cyan-900 text-cyan-500 text-xs font-bold rounded-full border border-gray-700 transition-colors">
          {t[lang].switchBtn}
        </button>

        <header className="mb-6 text-center mt-2">
          <h1 className="text-xl font-bold mb-1 text-cyan-400 tracking-tight">{t[lang].title}</h1>
        </header>

        <div className="space-y-5 flex flex-col">
          {/* 📂 檔案選擇區 */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-6 hover:border-cyan-500 transition-colors bg-gray-800 relative overflow-hidden">
            <input type="file" accept=".pdf, image/jpeg, image/png" onChange={handleFileChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer w-full text-center" />
            
            {!file && !showSizeWarning && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 font-medium">{t[lang].fileHint}</p>
                <p className="text-[10px] text-gray-500 mt-1">{t[lang].fileSubHint}</p>
              </div>
            )}
          </div>

          {/* 👁️ 預覽視窗 */}
          {previewUrl && (
            <div className="bg-gray-950 border border-gray-700 rounded-xl overflow-hidden flex flex-col items-center justify-center p-2 animate-fade-in relative">
               <span className="absolute top-2 left-2 bg-black/70 text-gray-300 text-[10px] px-2 py-1 rounded-md z-10 backdrop-blur-sm">Preview</span>
              {file?.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-contain rounded-lg" />
              ) : (
                <iframe src={previewUrl} className="w-full h-48 rounded-lg border-0 bg-white" />
              )}
            </div>
          )}

          {showSizeWarning && (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-center">
              <p className="text-red-400 font-bold mb-2 text-sm">{t[lang].warnSizeTitle}</p>
              <p className="text-xs text-gray-400">{t[lang].warnSizeDesc}</p>
            </div>
          )}

          {/* ⚙️ 列印設定：色彩與方向 */}
          {!showSizeWarning && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3 text-sm text-gray-300 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400">
                  <input type="radio" value="color" checked={colorMode === "color"} onChange={(e) => setColorMode(e.target.value)} className="accent-cyan-500 w-4 h-4" /> {t[lang].color}
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400">
                  <input type="radio" value="monochrome" checked={colorMode === "monochrome"} onChange={(e) => setColorMode(e.target.value)} className="accent-cyan-500 w-4 h-4" /> {t[lang].bw}
                </label>
              </div>
              <div className="flex flex-col gap-3 text-sm text-gray-300 bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400">
                  <input type="radio" value="portrait" checked={orientation === "portrait"} onChange={(e) => setOrientation(e.target.value)} className="accent-cyan-500 w-4 h-4" /> {t[lang].portrait}
                </label>
                <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400">
                  <input type="radio" value="landscape" checked={orientation === "landscape"} onChange={(e) => setOrientation(e.target.value)} className="accent-cyan-500 w-4 h-4" /> {t[lang].landscape}
                </label>
              </div>
            </div>
          )}

          <input type="password" placeholder={t[lang].passcode} value={passcode} onChange={(e) => setPasscode(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center tracking-widest font-mono shadow-inner" />

          <div className="flex justify-center scale-90">
            {/* ⚙️ 小工具設定：注意這裡記得替換成你的Turnstile site key */}
            <Turnstile siteKey="0x4AAAAAADDsQnq-Tr8bwOuV" onSuccess={(token) => setTurnstileToken(token)} options={{ theme: 'dark' }} />
          </div>

          <button onClick={handleUpload} disabled={uploading || showSizeWarning || !turnstileToken} className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${uploading || showSizeWarning || !turnstileToken ? "bg-gray-800 text-gray-500 cursor-not-allowed" : "bg-cyan-600 hover:bg-cyan-500 text-white"}`}>
            {uploading ? t[lang].btnProcessing : t[lang].btnPrint}
          </button>

          {status && (
            <p className={`text-center text-sm py-2 px-4 rounded-xl font-medium ${status.includes("✅") ? "bg-green-950/50 text-green-400" : "bg-red-950/50 text-red-400"}`}>{status}</p>
          )}
        </div>
      </div>
    </main>
  );
}
