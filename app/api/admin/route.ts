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
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const PASSCODES_FILE = path.join(process.cwd(), 'passcodes.txt');
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
const MAINTENANCE_LOCK = path.join(process.cwd(), 'maintenance.lock');

const authenticate = (req: Request) => {
  const authHeader = req.headers.get('Authorization') || '';
  const expectedPassword = process.env.ADMIN_PASSWORD?.trim();
  return authHeader.replace('Bearer ', '').trim() === expectedPassword;
};

export async function GET(req: Request) {
  if (!authenticate(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const passcodes = fs.existsSync(PASSCODES_FILE) ? fs.readFileSync(PASSCODES_FILE, 'utf-8') : '';
  const isMaintenance = fs.existsSync(MAINTENANCE_LOCK);
  
  // 計算暫存資料夾大小與檔案數
  let fileCount = 0;
  if (fs.existsSync(UPLOADS_DIR)) {
    fileCount = fs.readdirSync(UPLOADS_DIR).length;
  }

  return NextResponse.json({ passcodes, isMaintenance, fileCount });
}

export async function POST(req: Request) {
  if (!authenticate(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { action, payload } = await req.json();

  // 1. 更新密碼本
  if (action === 'update_passcodes') {
    fs.writeFileSync(PASSCODES_FILE, payload);
    return NextResponse.json({ success: true, message: '列印授權碼已更新' });
  }

  // 2. 切換維護模式
  if (action === 'toggle_maintenance') {
    if (fs.existsSync(MAINTENANCE_LOCK)) {
      fs.unlinkSync(MAINTENANCE_LOCK);
      return NextResponse.json({ success: true, message: '服務已恢復正常' });
    } else {
      fs.writeFileSync(MAINTENANCE_LOCK, 'under maintenance');
      return NextResponse.json({ success: true, message: '已啟動緊急停機模式' });
    }
  }

  // 3. 清空暫存檔案 (一鍵清空)
  if (action === 'clear_uploads') {
    if (fs.existsSync(UPLOADS_DIR)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      files.forEach(file => fs.unlinkSync(path.join(UPLOADS_DIR, file)));
    }
    return NextResponse.json({ success: true, message: '暫存資料夾已排空' });
  }

  // 4. 強制終止所有列印程序 (清理亂掉的佇列)
  if (action === 'kill_spooler') {
    // Windows 指令：強制關閉 SumatraPDF 进程，這會中斷目前所有正在傳送給印表機的工作
    exec('taskkill /F /IM SumatraPDF.exe', (err) => {
      console.log('已嘗試清空 SumatraPDF 程序');
    });
    return NextResponse.json({ success: true, message: '已嘗試終止所有進行中的列印工作' });
  }

  return NextResponse.json({ error: '未知動作' }, { status: 400 });
}