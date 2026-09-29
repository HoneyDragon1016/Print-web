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

const { spawn } = require('child_process');
const path = require('path');

process.chdir(__dirname);

// 使用 spawn 執行 next start，這會完全模擬 npm start 的行為
const ls = spawn('npx.cmd', ['next', 'start', '-p', '3000'], {
  shell: true,
  stdio: 'inherit' // 這樣 log 才會直接噴在 PM2 裡
});

ls.on('close', (code) => {
  console.log(`子進程退出，退出碼 ${code}`);
});