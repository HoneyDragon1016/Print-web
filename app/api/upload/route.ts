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
    const twoHours = 2 * 60 * 60 * 1000; // 2小時的毫秒數

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const fileStat = await stat(filePath);
      // 如果檔案的最後修改時間距離現在超過 2 小時，就刪除它
      if (now - fileStat.mtimeMs > twoHours) {
        await unlink(filePath).catch(() => {}); // 靜默處理刪除錯誤
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
    const colorMode = formData.get('colorMode') as string || 'color'; // 預設為彩色

    if (!file || !userPasscode) {
      return NextResponse.json({ error: '缺少檔案或密碼' }, { status: 400 });
    }

    // 🔒 後端雙重檢查檔案大小 (20MB = 20 * 1024 * 1024 bytes)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '檔案超出 20MB 限制' }, { status: 400 });
    }

    // --- 一次性密碼驗證邏輯 ---
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

    // 🏷️ 1. 為檔案加上時間戳記前綴，避免檔名衝突
    const uniqueFilename = `${Date.now()}_${file.name}`;
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const filePath = path.join(uploadsDir, uniqueFilename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // 🧹 4. 觸發自動清理機制 (不使用 await 阻塞列印流程，讓它在背景跑)
    cleanupOldFiles(uploadsDir);

    const sumatraPath = path.join(process.cwd(), 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');

    // 🎨 2. 黑白/彩色參數設定
    const printSettings = colorMode === 'monochrome' ? 'monochrome' : 'color';

    // 執行列印
    await execFileAsync(sumatraPath, [
      '-print-to', 'EPSON L360 Series',
      '-print-settings', printSettings, // 傳遞色彩設定給 SumatraPDF
      '-silent',
      filePath
    ]);

    return NextResponse.json({ message: '驗證成功，開始列印！' });
  } catch (error) {
    console.error("🔥 發生致命錯誤:", error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}