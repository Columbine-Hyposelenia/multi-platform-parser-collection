@echo off
chcp 65001 >nul
title 视频解析助手 - 启动程序
color 0A

echo.
echo ========================================
echo   视频解析助手 - 自动启动程序
echo ========================================
echo.

REM 检查 Node.js 是否安装
echo [1/4] 检查 Node.js 环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ 错误：未检测到 Node.js！
    echo.
    echo 请先安装 Node.js：
    echo 1. 访问 https://nodejs.org/zh-cn/
    echo 2. 下载并安装 LTS 版本
    echo 3. 安装完成后重启此程序
    echo.
    pause
    exit /b 1
)

node --version >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js 已安装: %NODE_VERSION%
) else (
    echo ❌ Node.js 未正确安装
    pause
    exit /b 1
)

echo.

REM 检查是否已安装依赖
echo [2/4] 检查项目依赖...
if not exist "node_modules" (
    echo ⚠️  未检测到依赖，正在安装...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ❌ 依赖安装失败！
        echo.
        echo 解决方法：
        echo 1. 检查网络连接
        echo 2. 尝试使用国内镜像：
        echo    npm config set registry https://registry.npmmirror.com
        echo.
        pause
        exit /b 1
    )
    echo.
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已安装
)

echo.

REM 检查必要文件
echo [3/4] 检查项目文件...
if not exist "server.js" (
    echo ❌ 错误：找不到 server.js 文件
    echo 请确保在正确的项目文件夹中运行此脚本
    pause
    exit /b 1
)
if not exist "package.json" (
    echo ❌ 错误：找不到 package.json 文件
    pause
    exit /b 1
)
echo ✅ 项目文件完整

echo.

REM 启动服务器
echo [4/4] 启动服务器...
echo.
echo ========================================
echo   服务器正在启动...
echo ========================================
echo.
echo 📌 启动成功后，请在浏览器中访问：
echo    http://localhost:3000
echo.
echo ⚠️  重要提示：
echo    - 不要关闭此窗口！
echo    - 关闭窗口服务器会停止
echo    - 按 Ctrl+C 可以停止服务器
echo.
echo ========================================
echo.

REM 启动 Node.js 服务器
node server.js

REM 如果服务器意外停止
echo.
echo ========================================
echo   服务器已停止
echo ========================================
echo.
pause

