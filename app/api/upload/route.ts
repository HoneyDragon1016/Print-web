import { NextResponse } from 'next/server';
import { writeFile, readFile, writeFile as updateFile, unlink, readdir, stat } from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
// 🔄 注意這裡新增了 degrees 用來控制旋轉角度
import { PDFDocument, degrees } from 'pdf-lib';
import sizeOf from 'image-size';

const execFileAsync = promisify(execFile);

async function cleanupOldFiles(uploadsDir: string) {
  try {
    const files = await readdir(uploadsDir);
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const fileStat = await stat(filePath);
      if (now - fileStat.mtimeMs > 2 * 60 * 60 * 1000) {
        await unlink(filePath).catch(() => {});
      }
    }
  } catch (err) {}
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userPasscode = formData.get('passcode') as string;
    const colorMode = formData.get('colorMode') as string || 'color';
    const orientation = formData.get('orientation') as string || 'portrait';
    const turnstileToken = formData.get('cf-turnstile-response') as string;

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

    const passcodeFilePath = path.join(process.cwd(), 'passcodes.txt');
    const passcodes = (await readFile(passcodeFilePath, 'utf-8')).split(/\r?\n/).filter(l => l.trim());
    const index = passcodes.indexOf(userPasscode);
    if (index === -1) return NextResponse.json({ error: '密碼無效' }, { status: 403 });
    passcodes.splice(index, 1);
    await updateFile(passcodeFilePath, passcodes.join('\n'));

    const uploadsDir = path.join(process.cwd(), 'uploads');
    let finalFilePath = path.join(uploadsDir, `${Date.now()}_${file.name}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
      const pdfDoc = await PDFDocument.create();
      
      // ⚠️ 關鍵：不管直印橫印，我們永遠塞給印表機一張「直式 A4 (595x841)」
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
        // 🔄 橫印魔法：把允許的最大寬度與高度「對調」
        const maxWidth = 841.89 - margin * 2;
        const maxHeight = 595.28 - margin * 2;
        const scale = Math.min(maxWidth / imgW, maxHeight / imgH);

        drawW = imgW * scale;
        drawH = imgH * scale;

        // 將圖片順時針翻轉 90 度，並重新計算完美置中的座標
        rotateDeg = degrees(-90);
        posX = cx - drawH / 2;
        posY = cy + drawW / 2;
      } else {
        // ⬇️ 直印：正常置中塞入
        const maxWidth = 595.28 - margin * 2;
        const maxHeight = 841.89 - margin * 2;
        const scale = Math.min(maxWidth / imgW, maxHeight / imgH);

        drawW = imgW * scale;
        drawH = imgH * scale;

        rotateDeg = degrees(0);
        posX = cx - drawW / 2;
        posY = cy - drawH / 2;
      }

      // 將圖片畫上畫布
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
      await writeFile(finalFilePath, buffer);
    }

    cleanupOldFiles(uploadsDir);

    const sumatraPath = path.join(process.cwd(), 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');
    const printSettings = colorMode === 'monochrome' ? 'monochrome' : 'color';

    // ⚠️ 關鍵：因為我們已經手動旋轉好了，不需要再把 landscape 傳給 SumatraPDF，加上 fit 防爆框即可
    await execFileAsync(sumatraPath, [
      '-print-to', 'EPSON L360 Series',
      '-print-settings', `${printSettings},fit`, 
      '-silent',
      finalFilePath
    ]);

    return NextResponse.json({ message: '列印成功！' });
  } catch (error) {
    console.error("🔥 發生錯誤:", error);
    return NextResponse.json({ error: '伺服器錯誤' }, { status: 500 });
  }
}