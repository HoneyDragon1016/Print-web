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

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { writeFile, readFile, writeFile as updateFile, unlink, readdir, stat } from 'fs/promises';
import fs from 'fs'; // 👈 檢查維護狀態必備
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { PDFDocument, degrees } from 'pdf-lib';
import sizeOf from 'image-size';

const execFileAsync = promisify(execFile);

// 🧹 清理舊檔案的附屬函式 (已將防護門移出)
async function cleanupOldFiles(uploadsDir: string) {
  try {
    const files = await readdir(uploadsDir);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const fileStat = await stat(filePath);
      // 刪除超過 2 小時的舊檔案
      if (now - fileStat.mtimeMs > 2 * 60 * 60 * 1000) {
        await unlink(filePath).catch(() => {});
      }
    }
  } catch (err) {
    console.error("清理檔案時發生錯誤:", err);
  }
}

// 🚀 主要處理上傳與列印的大門
export async function POST(request: Request) {
  try {
    // 🛡️ 絕對防禦門神：一進門先檢查是否緊急停機
    const MAINTENANCE_LOCK = path.join(process.cwd(), 'maintenance.lock');
    if (fs.existsSync(MAINTENANCE_LOCK)) {
      return NextResponse.json({ error: '系統維護中，暫停列印服務' }, { status: 503 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userPasscode = formData.get('passcode') as string;
    const colorMode = formData.get('colorMode') as string || 'color';
    const orientation = formData.get('orientation') as string || 'portrait';
    const turnstileToken = formData.get('cf-turnstile-response') as string;

    // 1. 基本檢查與人機驗證
    if (!file || !userPasscode) return NextResponse.json({ error: '缺少檔案或密碼' }, { status: 400 });
    if (!turnstileToken) return NextResponse.json({ error: '請完成人機驗證' }, { status: 401 });
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: '檔案過大' }, { status: 400 });

    const SECRET_KEY = process.env.TURNSTILE_SECRET_KEY; 
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${SECRET_KEY}&response=${turnstileToken}`,
    });
    if (!(await verifyRes.json()).success) return NextResponse.json({ error: '人機驗證失敗' }, { status: 401 });

    // 2. 密碼驗證與核銷 (用過即焚)
    const passcodeFilePath = path.join(process.cwd(), 'passcodes.txt');
    if (!fs.existsSync(passcodeFilePath)) {
      return NextResponse.json({ error: '系統未設定密碼本' }, { status: 500 });
    }
    const passcodes = (await readFile(passcodeFilePath, 'utf-8')).split(/\r?\n/).filter(l => l.trim());
    const index = passcodes.indexOf(userPasscode);
    if (index === -1) return NextResponse.json({ error: '密碼無效或已被使用' }, { status: 403 });
    
    passcodes.splice(index, 1);
    await updateFile(passcodeFilePath, passcodes.join('\n'));

    // 3. 檔案處理準備
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    let finalFilePath = path.join(uploadsDir, `${Date.now()}_${file.name}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    // 4. 圖片轉 PDF 魔法 (處理旋轉與置中)
    if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
      const pdfDoc = await PDFDocument.create();
      
      // 永遠塞給印表機一張「直式 A4 (595.28 x 841.89)」
      const page = pdfDoc.addPage([595.28, 841.89]);
      const cx = page.getWidth() / 2;
      const cy = page.getHeight() / 2;
      const margin = 20;
      
      let pdfImage = mimeType === 'image/jpeg' ? await pdfDoc.embedJpg(buffer) : await pdfDoc.embedPng(buffer);
      const isLandscape = orientation === 'landscape';
      const imgDims = sizeOf(buffer);
      const imgW = imgDims.width || 1;
      const imgH = imgDims.height || 1;

      let drawW, drawH, posX, posY, rotateDeg;

      if (isLandscape) {
        // 橫印魔法：允許的最大寬度與高度對調，並旋轉 90 度
        const maxWidth = 841.89 - margin * 2;
        const maxHeight = 595.28 - margin * 2;
        const scale = Math.min(maxWidth / imgW, maxHeight / imgH);

        drawW = imgW * scale;
        drawH = imgH * scale;

        rotateDeg = degrees(-90);
        posX = cx - drawH / 2;
        posY = cy + drawW / 2;
      } else {
        // 直印：正常置中塞入
        const maxWidth = 595.28 - margin * 2;
        const maxHeight = 841.89 - margin * 2;
        const scale = Math.min(maxWidth / imgW, maxHeight / imgH);

        drawW = imgW * scale;
        drawH = imgH * scale;

        rotateDeg = degrees(0);
        posX = cx - drawW / 2;
        posY = cy - drawH / 2;
      }

      page.drawImage(pdfImage, {
        x: posX,
        y: posY,
        width: drawW,
        height: drawH,
        rotate: rotateDeg,
      });

      finalFilePath = path.join(uploadsDir, `${Date.now()}_converted.pdf`);
      await writeFile(finalFilePath, await pdfDoc.save());
    } else {
      // 若本身就是 PDF，直接寫入
      await writeFile(finalFilePath, buffer);
    }

    // 觸發背景清理舊檔案
    cleanupOldFiles(uploadsDir);

    // 5. 傳送至 SumatraPDF 進行列印
    const sumatraPath = path.join(process.cwd(), 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');
    const printSettings = colorMode === 'monochrome' ? 'monochrome' : 'color';

    await execFileAsync(sumatraPath, [
      '-print-to', 'EPSON L360 Series',
      '-print-settings', `${printSettings},fit`, 
      '-silent',
      finalFilePath
    ]);

    return NextResponse.json({ message: '列印成功！' });
  } catch (error) {
    console.error("🔥 發生錯誤:", error);
    return NextResponse.json({ error: '伺服器發生未知錯誤，請聯絡管理員' }, { status: 500 });
  }
}