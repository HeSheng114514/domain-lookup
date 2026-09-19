@echo off
chcp 65001 >nul 2>&1
setlocal
cd /d "%~dp0"

set PORT=8420
if not "%~1"=="" set PORT=%~1

echo.
echo   ============================================
echo      域名查询工具  WHOIS / RDAP / DNS
echo   ============================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo   [错误] 没有找到 Node.js。
  echo   请先安装 Node.js 18 或更高版本: https://nodejs.org/
  echo.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -v') do set NODEV=%%v
echo   Node.js 版本: %NODEV%
echo   服务端口:    %PORT%
echo.
echo   启动后浏览器会自动打开,关闭本窗口即可停止服务。
echo.

start "" http://127.0.0.1:%PORT%/
node "%~dp0server.js" %PORT%

echo.
echo   服务已停止。
pause
