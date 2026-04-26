"use client";

import { useState } from "react";
import { Turnstile } from '@marsidev/react-turnstile'; // 👈 載入 Turnstile 套件

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [colorMode, setColorMode] = useState("color");
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [showFormatWarning, setShowFormatWarning] = useState(false);
  
  // 🛡️ 新增狀態：用來儲存 Cloudflare 發給這個使用者的通行證
  const [turnstileToken, setTurnstileToken] = useState("");

  const [lang, setLang] = useState<"zh" | "en">("zh");

  // 📖 雙語字典
  const t = {
    zh: {
      title: "自助列印服務",
      switchBtn: "EN",
      fileHint: "僅支援 PDF 格式 (最大 20MB)",
      fileSubHint: "若是圖片，請先排版並匯出為 PDF",
      selected: "已選擇:",
      warnFormatTitle: "⚠️ 格式不支援 (僅限 PDF)",
      warnFormatDesc: "圖片直接列印會導致排版錯亂或印出空白紙。請先將您的圖片轉換為 PDF 格式。",
      btnJpgToPdf: "前往 JPG 轉 PDF",
      warnSizeTitle: "⚠️ 檔案超出 20MB 限制",
      warnSizeDesc: "為了確保列印穩定度，請將檔案壓縮後再上傳。",
      btnCompress: "壓縮 PDF",
      color: "彩色",
      bw: "黑白",
      passcode: "請輸入一次性授權碼",
      btnPrint: "確認授權並列印",
      btnProcessing: "處理中...",
      errEmpty: "請先選擇文件並輸入驗證碼",
      errTurnstile: "🛡️ 請先等待人機驗證完成",
      statusUploading: "驗證授權並上傳中...",
      statusSuccess: "✅ 驗證成功，開始列印！",
      errPasscode: "❌ 密碼無效或已被使用",
      errServer: "❌ 伺服器錯誤",
      errConn: "❌ 連線伺服器失敗",
      errBot: "❌ 人機驗證失敗，請重整網頁",
    },
    en: {
      title: "Self-Service Printing",
      switchBtn: "中文",
      fileHint: "PDF Only (Max 20MB)",
      fileSubHint: "For images, please format and export as PDF first",
      selected: "Selected:",
      warnFormatTitle: "⚠️ Unsupported Format",
      warnFormatDesc: "Printing images directly may result in blank pages. Please convert to PDF first.",
      btnJpgToPdf: "Convert JPG to PDF",
      warnSizeTitle: "⚠️ File Exceeds 20MB",
      warnSizeDesc: "To ensure print stability, please compress the file before uploading.",
      btnCompress: "Compress PDF",
      color: "Color",
      bw: "B&W",
      passcode: "Enter one-time passcode",
      btnPrint: "Verify & Print",
      btnProcessing: "Processing...",
      errEmpty: "Please select a file and enter passcode",
      errTurnstile: "🛡️ Please wait for security check",
      statusUploading: "Verifying and uploading...",
      statusSuccess: "✅ Verification successful, printing started!",
      errPasscode: "❌ Invalid or expired passcode",
      errServer: "❌ Server error",
      errConn: "❌ Failed to connect to server",
      errBot: "❌ Security check failed, please refresh",
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setShowFormatWarning(true);
        setShowSizeWarning(false);
        setFile(null);
        return;
      } else {
        setShowFormatWarning(false);
      }

      if (selectedFile.size > 20 * 1024 * 1024) {
        setShowSizeWarning(true);
        setFile(null);
      } else {
        setShowSizeWarning(false);
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !passcode) {
      setStatus(t[lang].errEmpty);
      return;
    }
    // 🛡️ 阻擋機器人：如果還沒拿到 Token，就不准發送請求
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
    formData.append("cf-turnstile-response", turnstileToken); // 👈 把通行證夾帶進去

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
        // 成功後建議重設驗證碼，但為了簡單先保持現狀，交由重整網頁處理
      } else {
        if (response.status === 403) setStatus(t[lang].errPasscode);
        else if (response.status === 401) setStatus(t[lang].errBot);
        else if (response.status === 500) setStatus(t[lang].errServer);
        else setStatus("❌ " + (data.error || "Error"));
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
      <div className="w-full max-w-md bg-gray-900 rounded-3xl p-10 shadow-2xl border border-gray-800 relative">
        <button onClick={toggleLanguage} className="absolute top-6 right-6 px-3 py-1 bg-gray-800 hover:bg-cyan-900 text-cyan-500 hover:text-cyan-300 text-xs font-bold rounded-full border border-gray-700 transition-colors">
          {t[lang].switchBtn}
        </button>

        <header className="mb-8 text-center mt-2">
          <h1 className="text-xl font-bold mb-1 text-cyan-400 tracking-tight">{t[lang].title}</h1>
          <p className="text-sm text-gray-500">Cloud Document Print System</p>
        </header>

        <div className="space-y-6 flex flex-col">
          {/* 檔案選擇區塊 */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 rounded-xl p-8 hover:border-cyan-500 transition-colors bg-gray-800 relative">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 cursor-pointer w-full text-center" />
            {file && <p className="mt-4 text-xs text-cyan-300 px-4 text-center break-all">{t[lang].selected} {file.name}</p>}
            {!file && !showSizeWarning && !showFormatWarning && (
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 font-medium">{t[lang].fileHint}</p>
                <p className="text-[10px] text-gray-500 mt-1">{t[lang].fileSubHint}</p>
              </div>
            )}
          </div>

          {/* 警告區塊 */}
          {showFormatWarning && (
            <div className="p-4 bg-orange-950/50 border border-orange-800 rounded-xl text-center animate-fade-in">
              <p className="text-orange-400 font-bold mb-2 text-sm">{t[lang].warnFormatTitle}</p>
              <p className="text-xs text-gray-400 mb-4">{t[lang].warnFormatDesc}</p>
              <a href="https://www.ilovepdf.com/zh-tw/jpg_to_pdf" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-orange-900 hover:bg-orange-800 text-orange-100 rounded-lg text-xs font-semibold transition-colors inline-block">{t[lang].btnJpgToPdf}</a>
            </div>
          )}
          {showSizeWarning && (
            <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-center animate-fade-in">
              <p className="text-red-400 font-bold mb-2 text-sm">{t[lang].warnSizeTitle}</p>
              <p className="text-xs text-gray-400 mb-4">{t[lang].warnSizeDesc}</p>
              <a href="https://www.ilovepdf.com/zh-tw/compress_pdf" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-lg text-xs font-semibold transition-colors inline-block">{t[lang].btnCompress}</a>
            </div>
          )}

          {/* 色彩選擇 */}
          {!showSizeWarning && !showFormatWarning && (
            <div className="flex justify-center gap-8 text-sm text-gray-300 bg-gray-800/50 py-3 rounded-xl border border-gray-700/50">
              <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                <input type="radio" name="colorMode" value="color" checked={colorMode === "color"} onChange={(e) => setColorMode(e.target.value)} className="accent-cyan-500 w-4 h-4 cursor-pointer" /> {t[lang].color}
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-cyan-400 transition-colors">
                <input type="radio" name="colorMode" value="monochrome" checked={colorMode === "monochrome"} onChange={(e) => setColorMode(e.target.value)} className="accent-cyan-500 w-4 h-4 cursor-pointer" /> {t[lang].bw}
              </label>
            </div>
          )}

          {/* 密碼輸入 */}
          <div className="flex flex-col">
            <input type="password" placeholder={t[lang].passcode} value={passcode} onChange={(e) => setPasscode(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-center tracking-widest font-mono shadow-inner placeholder-gray-600" />
          </div>

          {/* 🛡️ Turnstile 驗證區塊 */}
          <div className="flex justify-center">
            <Turnstile
              siteKey="0x4AAAAAADDsQnq-Tr8bwOuV" // ⚠️ 公開 Site Key
              onSuccess={(token) => setTurnstileToken(token)}
              options={{ theme: 'dark' }} 
            />
          </div>

          {/* 列印按鈕 */}
          <button onClick={handleUpload} disabled={uploading || showSizeWarning || showFormatWarning || !turnstileToken} className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg ${uploading || showSizeWarning || showFormatWarning || !turnstileToken ? "bg-gray-800 text-gray-500 cursor-not-allowed shadow-none border border-gray-700" : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20"}`}>
            {uploading ? t[lang].btnProcessing : t[lang].btnPrint}
          </button>

          {status && (
            <p className={`text-center text-sm py-3 px-4 rounded-xl font-medium animate-fade-in ${status.includes("✅") ? "bg-green-950/50 text-green-400 border border-green-900" : "bg-red-950/50 text-red-400 border border-red-900"}`}>
              {status}
            </p>
          )}
        </div>
      </div>
      <footer className="mt-12 text-gray-700 text-[9px] tracking-[0.3em] uppercase">Connected Mode • Secure Node</footer>
    </main>
  );
}