module.exports = {
  apps: [{
    name: "print-service",
    // 直接指路給 Node，叫它執行 Next.js 的二進位腳本
    script: "./node_modules/next/dist/bin/next",
    args: "start",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
}