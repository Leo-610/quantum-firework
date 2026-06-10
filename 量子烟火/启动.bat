@echo off
chcp 65001 >nul
title 量子烟火 · 开发服务器

set "NODE_PATH=C:\Program Files\nodejs"
set "PATH=%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin;%APPDATA%\npm;%PATH%"

cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════╗
echo  ║    量子烟火  启动中...       ║
echo  ╚══════════════════════════════╝
echo.

"%NODE_PATH%\npm.cmd" run dev

pause
