import { NextResponse } from 'next/server';
import { writeFile, readFile, writeFile as updateFile, unlink, readdir, stat } from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// 🧹 清理舊檔案的常駐函數 (保留 2 小時)
async function cleanupOldFiles(uploadsDir: string) {
  try {
    const files = await readdir(uploadsDir);
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const fileStat = await stat(filePath);
      if (now - fileStat.mtimeMs > twoHours) {
        await unlink(filePath).catch(() => {});
      }
    }
  } catch (err) {
    console.error("清理檔案失敗:", err);
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userPasscode = formData.get('passcode') as string;
    const colorMode = formData.get('colorMode') as string || 'color';
    
    // 🛡️ 1. 取得前端傳來的 Turnstile Token
    const turnstileToken = formData.get('cf-turnstile-response') as string;

    if (!file || !userPasscode) {
      return NextResponse.json({ error: '缺少檔案或密碼' }, { status: 400 });
    }
    
    // 🛡️ 2. 攔截沒有夾帶人機驗證 Token 的非法請求
    if (!turnstileToken) {
      return NextResponse.json({ error: '請完成人機驗證' }, { status: 401 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '檔案超出 20MB 限制' }, { status: 400 });
    }

    // 🛡️ 3. 向 Cloudflare 發送驗證請求 (讀取環境變數中的金鑰)
    const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY; 

    if (!SECRET_KEY) {
      console.error("🔥 系統未設定 TURNSTILE_SECRET_KEY 環境變數");
      return NextResponse.json({ error: '伺服器設定錯誤' }, { status: 500 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${SECRET_KEY}&response=${turnstileToken}`,
    });

    const verifyData = await verifyRes.json();
    
    // 🛡️ 4. 如果 Cloudflare 說這不是真人，直接退回
    if (!verifyData.success) {
      console.error("機器人攻擊攔截:", verifyData);
      return NextResponse.json({ error: '人機驗證失敗' }, { status: 401 });
    }

    // --- 🔐 以下為原本的一次性密碼驗證邏輯 ---
    const passcodeFilePath = path.join(process.cwd(), 'passcodes.txt');
    const passcodesContent = await readFile(passcodeFilePath, 'utf-8');
    const passcodes = passcodesContent.split(/\r?\n/).filter(line => line.trim() !== '');

    const index = passcodes.indexOf(userPasscode);
    if (index === -1) {
      return NextResponse.json({ error: '密碼無效或已被使用' }, { status: 403 });
    }
    passcodes.splice(index, 1);
    await updateFile(passcodeFilePath, passcodes.join('\n'));
    // ----------------------------

    // 🏷️ 為檔案加上時間戳記前綴
    const uniqueFilename = `${Date.now()}_${file.name}`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, uniqueFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    cleanupOldFiles(uploadsDir);

    const sumatraPath = path.join(process.cwd(), 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');
    const printSettings = colorMode === 'monochrome' ? 'monochrome' : 'color';

    await execFileAsync(sumatraPath, [
      '-print-to', 'EPSON L360 Series',
      '-print-settings', printSettings,
      '-silent',
      filePath
    ]);

    return NextResponse.json({ message: '驗證成功，開始列印！' });
  } catch (error) {
    console.error("🔥 發生致命錯誤:", error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}