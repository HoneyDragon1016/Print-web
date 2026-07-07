[**繁體中文**](./README.zh-TW.md) | [**English**](./README.md)
# 🖨️ Cloud Document Print System

This is a "Cloud Remote Printing System" designed specifically for physical self-service printing stations. By leveraging modern Web architecture and intranet tunneling technologies, it transforms a local printer into a secure cloud service. Users do not need to install any drivers; they simply upload documents via the webpage and enter a one-time authorization code to drive the local physical printer.

## Featuring smart layout conversion and an emergency shutdown mechanism, this project is built specifically to handle complex unmanned operational scenarios.

### ✨ Key Features

* **📄 Auto-PDF Conversion**: Supports uploading PDF and common image formats (JPG/PNG). The system automatically converts images to A4 PDFs and features "smart portrait/landscape detection" and "center-scaled anti-cropping" algorithms to ensure perfect, uncropped printouts.
* **🔐 One-Time Password (OTP & Burn-After-Reading)**: Employs a token-based authentication mechanism. The password is destroyed immediately upon successful verification, ensuring printing privileges are not abused.
* **🛑 Emergency Shutdown & Troubleshooting Mechanism**: Built-in hidden admin panel supporting a one-click "System Maintenance Mode" to block new tasks. In case of physical paper jams, a one-click "Kill Spooler" function interrupts all transmissions to prevent further issues.
* **🛡️ Enterprise-Grade Security**: Integrates Cloudflare Turnstile CAPTCHA, combined with backend key matching and strict file extension filtering, completely blocking malicious scripts.
* **⚖️ Load Protection Mechanism**: Limits maximum upload size (20MB) and implements a scheduled garbage collection routine to automatically clear expired files and temporary directories older than 2 hours, protecting the server's hard drive.
* **🎨 Customizable Print Parameters**: Allows users to select "Color / Black & White" modes on the frontend, precisely passing the parameters to the underlying print engine.

### 🛠️ Tech Stack

* **Frontend Framework**: Next.js (React), Tailwind CSS, Lucide React
* **Backend Environment**: Node.js
* **Document Processing**: `pdf-lib` (PDF construction and image layout), `image-size`
* **Print Engine**: SumatraPDF (Wrapped via `pdf-to-printer`, using `child_process` to bypass path bundling conflicts)
* **Intranet Tunneling**: Cloudflare Tunnel
* **Advanced Protection**: Cloudflare Turnstile

### ⚙️ Installation & Setup

**1. Prerequisites**
* Windows OS (Responsible for mounting the physical printer)
* Node.js (v18+ recommended)
* A physical printer connected with drivers properly installed (This project defaults to `EPSON L360 Series`)

**2. Environment Variables Setup**
Create a `.env` or `.env.local` file in the project root directory and configure the following keys:
```env
TURNSTILE_SECRET_KEY=Your_Cloudflare_Secret_Key
ADMIN_PASSWORD=Your_Super_Admin_Password

```

*(Note: This file contains sensitive information, do NOT upload it to a public repository)*

**3. Installation and Build**

```bash
npm install
npm run build

```

**4. Start Background Service**
To keep the service running stably in the background, it is recommended to use PM2 for management:

```bash
pm2 start npm --name "print-service" -- start
pm2 save

```

### 📖 How to Use

**For Station Masters / Administrators:**

1. Access the hidden admin panel (`/admin-panel-888`) and enter the super password.
2. Update the authorization password book or monitor the number of documents currently in the server's staging area.
3. In case of hardware failure (e.g., out of ink, paper jams), immediately activate the "Emergency Shutdown" to block user uploads, and clear the stacked print spooler with one click.

**For Users:**

1. Enter the system's web portal.
2. Click to upload a PDF or image file.
3. Select the desired color mode (Color / Black & White) and layout orientation.
4. Complete the Cloudflare CAPTCHA and enter the one-time authorization code provided by the station master.
5. Click "Confirm Authorization and Print" and collect your documents at the physical machine.

## 🔒 Security

This project has been hardened for public network operations with the following measures:

* Dual frontend and backend checks for file size and MIME Types to prevent malicious script uploads.
* Physical separation of secret keys and source code.
* All API requests undergo strict permission and state (maintenance lock) interception and validation.

*Built for efficiency and reliability.*

```

```
