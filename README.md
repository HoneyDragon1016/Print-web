<div align="center">

# 🖨️ Cloud Document Print System

**雲端自助列印服務 — 將本地實體印表機，安全地轉化為雲端列印站點。**

Upload documents from any browser — no drivers required — and print
securely on-site with a one-time authorization code.

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

## 📌 Overview

This is a **Cloud Remote Printing System** designed specifically for physical self-service printing stations. By leveraging modern Web architecture and intranet tunneling technologies, it transforms a local printer into a secure cloud service. Users do not need to install any drivers; they simply upload documents via the webpage and enter a one-time authorization code to drive the local physical printer.

Featuring smart layout conversion and an emergency shutdown mechanism, this project is built specifically to handle complex unmanned operational scenarios.

> *Built for efficiency and reliability.*

## ✨ Key Features

| | Feature | Description |
|:---:|---|---|
| 📄 | **Auto-PDF Conversion** | Supports uploading PDF and common image formats (JPG/PNG). The system automatically converts images to A4 PDFs and features "smart portrait/landscape detection" and "center-scaled anti-cropping" algorithms to ensure perfect, uncropped printouts. |
| 🔐 | **One-Time Password (OTP, Burn-After-Reading)** | Employs a token-based authentication mechanism. The password is destroyed immediately upon successful verification, ensuring printing privileges are not abused. |
| 🛑 | **Emergency Shutdown & Troubleshooting** | Built-in hidden admin panel supporting a one-click "System Maintenance Mode" to block new tasks. In case of physical paper jams, a one-click "Kill Spooler" function interrupts all transmissions to prevent further issues. |
| 🛡️ | **Enterprise-Grade Security** | Integrates Cloudflare Turnstile CAPTCHA, combined with backend key matching and strict file extension filtering, completely blocking malicious scripts. |
| ⚖️ | **Load Protection** | Limits maximum upload size (20 MB) and implements a scheduled garbage collection routine to automatically clear expired files and temporary directories older than 2 hours, protecting the server's hard drive. |
| 🎨 | **Customizable Print Parameters** | Allows users to select "Color / Black & White" modes on the frontend, precisely passing the parameters to the underlying print engine. |

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | Next.js (React) · Tailwind CSS · Lucide React |
| **Backend Environment** | Node.js |
| **Document Processing** | [`pdf-lib`](https://pdf-lib.js.org/) (PDF construction & image layout) · [`image-size`](https://www.npmjs.com/package/image-size) |
| **Print Engine** | [SumatraPDF](https://www.sumatrapdfreader.org/) (wrapped via [`pdf-to-printer`](https://www.npmjs.com/package/pdf-to-printer), using `child_process` to bypass path bundling conflicts) |
| **Intranet Tunneling** | [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/) |
| **Advanced Protection** | [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/) |

## 📁 Project Structure

```text
Print-web/
├── app/
│   ├── page.tsx               # User upload & print portal
│   ├── layout.tsx             # Global layout & metadata
│   ├── globals.css            # Global styles
│   ├── admin-panel-888/       # Hidden admin panel (UI)
│   └── api/
│       ├── upload/            # Upload / PDF conversion / print API
│       └── admin/             # Admin API (maintenance, OTP book, spooler)
├── public/                    # Static assets
├── ecosystem.config.js        # PM2 process configuration
├── start-node.js              # Startup script
└── next.config.ts             # Next.js configuration
```

## 🚀 Getting Started

### 1️⃣ Prerequisites

* **Windows OS** (responsible for mounting the physical printer)
* **Node.js** (v18+ recommended)
* A **physical printer** connected with drivers properly installed (this project defaults to `EPSON L360 Series`)

### 2️⃣ Environment Variables

Create a `.env` or `.env.local` file in the project root directory:

```env
TURNSTILE_SECRET_KEY=Your_Cloudflare_Secret_Key
ADMIN_PASSWORD=Your_Super_Admin_Password
```

| Variable | Description |
|---|---|
| `TURNSTILE_SECRET_KEY` | Secret key of the Cloudflare Turnstile widget |
| `ADMIN_PASSWORD` | Super admin password for the hidden control panel |

> ⚠️ **Note:** This file contains sensitive information — do **NOT** upload it to a public repository.

### 3️⃣ Installation and Build

```bash
npm install
npm run build
```

### 4️⃣ Start Background Service

To keep the service running stably in the background, it is recommended to use [PM2](https://pm2.keymetrics.io/) for management:

```bash
pm2 start npm --name "print-service" -- start
pm2 save
```

## 📖 How to Use

<details>
<summary><b>🧑‍💼 For Station Masters / Administrators</b></summary>

1. Access the hidden admin panel (`/admin-panel-888`) and enter the super password.
2. Update the authorization password book or monitor the number of documents currently in the server's staging area.
3. In case of hardware failure (e.g., out of ink, paper jams), immediately activate the "Emergency Shutdown" to block user uploads, and clear the stacked print spooler with one click.

</details>

<details>
<summary><b>👤 For Users</b></summary>

1. Enter the system's web portal.
2. Click to upload a PDF or image file.
3. Select the desired color mode (Color / Black & White) and layout orientation.
4. Complete the Cloudflare CAPTCHA and enter the one-time authorization code provided by the station master.
5. Click "Confirm Authorization and Print" and collect your documents at the physical machine.

</details>

## 🔒 Security

This project has been hardened for public network operations with the following measures:

* ✅ Dual frontend and backend checks for file size and MIME Types to prevent malicious script uploads.
* ✅ Physical separation of secret keys and source code.
* ✅ All API requests undergo strict permission and state (maintenance lock) interception and validation.

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
