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