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