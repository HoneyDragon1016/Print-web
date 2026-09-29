<div align="center">

# 🖨️ Cloud Document Print System

**雲端自助列印服務 — 將本地實體印表機，安全地轉化為雲端列印站點。**

使用者無須安裝任何驅動程式，只需透過網頁上傳文件、輸入一次性授權碼，即可驅動本地實體印表機。

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: GPLv3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/HoneyDragon1016/Print-web/pulls)
[![Maintenance](https://img.shields.io/badge/maintenance-active-success.svg)](https://github.com/HoneyDragon1016/Print-web)

[**繁體中文**](./README.zh-TW.md) · [**English**](./README.md)

</div>

---

## 📌 專案簡介

這是一個專為實體自助列印站點設計的「**雲端遠端列印系統**」。透過現代化的 Web 架構與內網穿透技術，將本地端的印表機轉化為安全的雲端服務。此專案具備智慧排版轉檔與緊急停機機制，專為應對複雜的無人化營運場景而生。

> *Built for efficiency and reliability.*

## ✨ 核心功能 (Key Features)

| | 功能 | 說明 |
|:---:|---|---|
| 📄 | **智慧格式轉換 (Auto-PDF Conversion)** | 支援 PDF 與常見圖片檔 (JPG/PNG) 上傳。系統會自動將圖片轉換為 A4 PDF，並具備「智慧判斷橫/直印」與「防爆框置中縮放」演算法，確保列印成品完美不裁切。 |
| 🔐 | **一次性授權碼 (OTP 閱後即焚)** | 採用代幣驗證機制，驗證成功後立即銷毀密碼，確保列印權限不被濫用。 |
| 🛑 | **緊急停機與排障機制** | 內建隱藏管理後台，支援一鍵開啟「系統維護模式」阻擋新任務；遇到實體卡紙時，可一鍵「清空列印程序 (Kill Spooler)」中斷所有傳輸，防止災情擴大。 |
| 🛡️ | **企業級資安防禦** | 整合 Cloudflare Turnstile 人機驗證，搭配後端金鑰比對與副檔名嚴格過濾，徹底阻擋惡意腳本。 |
| ⚖️ | **負載保護機制** | 限制最大上傳容量 (20MB)，並實作定時垃圾車機制，自動清除 2 小時前的過期檔案與暫存區，保護伺服器硬碟。 |
| 🎨 | **自訂列印參數** | 支援前端選擇「彩色 / 黑白」模式，精準傳遞至底層列印引擎。 |

## 🛠️ 技術棧 (Tech Stack)

| 層級 | 技術 |
|---|---|
| **前端框架** | Next.js (React) · Tailwind CSS · Lucide React |
| **後端環境** | Node.js |
| **文件處理** | [`pdf-lib`](https://pdf-lib.js.org/)（PDF 建構與圖片排版）· [`image-size`](https://www.npmjs.com/package/image-size) |
| **列印引擎** | [SumatraPDF](https://www.sumatrapdfreader.org/)（透過 [`pdf-to-printer`](https://www.npmjs.com/package/pdf-to-printer) 封裝，以 `child_process` 繞過路徑打包衝突） |
| **內網穿透** | [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) |
| **進階防護** | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |

## 📁 專案結構

```text
Print-web/
├── app/
│   ├── page.tsx               # 使用者上傳與列印入口
│   ├── layout.tsx             # 全域版面與中繼資料
│   ├── globals.css            # 全域樣式
│   ├── admin-panel-888/       # 隱藏管理後台（UI）
│   └── api/
│       ├── upload/            # 上傳 / PDF 轉檔 / 列印 API
│       └── admin/             # 管理 API（維護模式、密碼本、清空 Spooler）
├── public/                    # 靜態資源
├── ecosystem.config.js        # PM2 程序設定
├── start-node.js              # 啟動腳本
└── next.config.ts             # Next.js 設定
```

## 🚀 系統環境與安裝 (Getting Started)

### 1️⃣ 環境需求

* **Windows 系統**（負責掛載實體印表機）
* **Node.js**（建議 v18+）
* **實體印表機**已連接並正確安裝驅動（本專案預設指定 `EPSON L360 Series`）

### 2️⃣ 環境變數設定

在專案根目錄建立 `.env` 或 `.env.local` 檔案：

```env
TURNSTILE_SECRET_KEY=您的_Cloudflare_Secret_Key
ADMIN_PASSWORD=您的_超級管理員密碼
```

| 變數 | 說明 |
|---|---|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile 人機驗證元件的 Secret Key |
| `ADMIN_PASSWORD` | 隱藏管理後台的超級管理員密碼 |

> ⚠️ **請注意：** 此檔案包含機密資訊，切勿上傳至公開版本庫。

### 3️⃣ 初始化安裝與編譯

```bash
npm install
npm run build
```

### 4️⃣ 啟動背景服務

為了讓服務在背景持續穩定運行，建議使用 [PM2](https://pm2.keymetrics.io/) 進行管理：

```bash
pm2 start npm --name "print-service" -- start
pm2 save
```

## 📖 操作流程 (How to Use)

<details>
<summary><b>🧑‍💼 站長 / 管理員端</b></summary>

1. 進入隱藏管理後台（`/admin-panel-888`），輸入超級密碼。
2. 更新授權密碼本，或監控目前伺服器暫存區的文件數量。
3. 遇到硬體故障（如無墨水、卡紙）時，立即啟動「緊急停機」阻擋使用者上傳，並可一鍵清空堆積的列印程序。

</details>

<details>
<summary><b>👤 使用者端</b></summary>

1. 進入系統網頁入口。
2. 點擊上傳 PDF 或圖片檔案。
3. 選擇需要的色彩模式（彩色/黑白）與排版方向。
4. 完成 Cloudflare 驗證框，輸入站長提供的一次性授權碼。
5. 點擊「確認授權並列印」，於現場機台拿取文件。

</details>

## 🔒 安全性聲明 (Security)

本專案針對公開網路營運進行了以下加固：

* ✅ 前後端雙重檢查檔案大小與 MIME Type，防止惡意腳本上傳。
* ✅ 機密金鑰與程式碼物理分離。
* ✅ 所有 API 請求皆經過嚴格的權限與狀態（維護鎖）攔截校驗。

---

## ⚖️ 授權協議 (License)  
本專案採用 **雙重授權模式 (Dual-Licensing)** 來保護作者權益與開源社群。  

### 1. 開源與非商業/個人用途  
本專案預設採用 [GNU General Public License v3.0 (GPLv3)](LICENSE) 協議授權。  
您可以自由地使用、修改與散佈本程式碼。但依據 GPLv3 的傳染性條款，**任何使用了本專案程式碼的衍生專案，都必須同樣以 GPLv3 協議完全開源**。  

### 2. 商業與閉源用途 (Commercial & Closed-Source Use)  
如果您希望將本專案的程式碼用於商業產品、公司內部專案，且**不願意或無法開源您的專案原始碼**，您必須在專案發布前向作者取得商業授權。未經授權將本專案用於閉源商業產品，即構成對 GPLv3 協議的違反與侵權。  

📩 **商業授權聯絡方式：**  
* Email: <service@honeychen.uk>  
