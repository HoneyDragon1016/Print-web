# 🖨️ 雲端自助列印服務 (Cloud Document Print System)
這是一個專為實體自助列印站點設計的「雲端遠端列印系統」。透過現代化的 Web 架構與內網穿透技術，將本地端的印表機轉化為安全的雲端服務。使用者無須安裝任何驅動程式，只需透過網頁上傳 PDF 與輸入一次性授權碼，即可驅動本地實體印表機進行列印。

## 此專案特別注重防呆機制與資訊安全，旨在提供低維護成本、高穩定性的無人化營運體驗。

### ✨ 核心功能 (Key Features)
📄 嚴格 PDF 模式：系統層級阻擋圖片與非 PDF 格式，避免排版錯亂或印出空白紙，並提供轉檔工具引導。

🔐 一次性授權碼 (OTP)：採用閱後即焚的密碼驗證機制，驗證成功後立即銷毀，確保列印權限不被濫用。

🛡️ 企業級資安防禦：整合 Cloudflare Turnstile 零干擾人機驗證，搭配後端金鑰比對，徹底阻擋自動化腳本與惡意攻擊。

⚖️ 負載保護機制：限制最大上傳容量 (20MB)，並實作定時垃圾車機制，自動刪除 2 小時前的過期檔案，保護伺服器硬碟。

🎨 自訂列印參數：支援前端選擇「彩色 / 黑白」模式，精準傳遞至底層列印引擎。

🌐 國際化雙語介面：內建中/英 (ZH/EN) 一鍵切換功能，友善外籍使用者。

### 🛠️ 技術棧 (Tech Stack)
前端框架：Next.js (React), Tailwind CSS

後端環境：Node.js

列印引擎：SumatraPDF (透過 pdf-to-printer 封裝，以 child_process 繞過路徑打包衝突)

內網穿透：Cloudflare Tunnel

進階防護：Cloudflare Turnstile, Cloudflare WAF

進程管理：PM2

### ⚙️ 系統環境與安裝 (Installation & Setup)
1. 環境需求
Windows 系統 (負責掛載實體印表機)

Node.js (建議 v18+)

實體印表機已連接並設定為預設 (本專案預設指定 EPSON L360 Series)

2. 環境變數設定
在專案根目錄建立 .env.local 檔案，並配置 Cloudflare Turnstile 的 Secret Key：

程式碼片段
```
TURNSTILE_SECRET_KEY=您的_Cloudflare_Secret_Key
```
(請注意：此檔案包含機密資訊，已被加入 .gitignore，切勿上傳至公開版本庫)

3. 初始化安裝與編譯
```
Bash
npm install
npm run build
```
4. 啟動背景服務
為了讓服務在背景持續穩定運行，建議使用 PM2 進行管理：
```
Bash
pm2 start npm --name "print-service" -- start
pm2 save
```
### 📖 操作流程 (How to Use)
站長/管理員端：
於專案目錄下的 passcodes.txt 中寫入一次性密碼（每行一個）。

將密碼發送給有列印需求的使用者。

確保印表機（如 EPSON L360）電源開啟且紙張/墨水充足。

使用者端：
進入系統網頁入口。

點擊上傳已排版好之 PDF 檔案。

選擇需要的色彩模式（彩色/黑白）。

完成 Cloudflare 驗證框，輸入站長提供的一次性授權碼。

點擊「確認授權並列印」，於現場機台拿取文件。

## 🔒 安全性聲明 (Security)
本專案針對公開網路營運進行了以下加固：

拒絕執行權限過高的 Administrator 帳戶運行 Web 服務。

前後端雙重檢查檔案大小與副檔名，防止惡意腳本上傳。

機密金鑰與程式碼物理分離。

Built for efficiency and reliability.
