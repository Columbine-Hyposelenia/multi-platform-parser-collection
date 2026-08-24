@echo off
chcp 65001 >nul
title 本地测试环境安装
color 0E

echo.
echo ========================================
echo   本地测试环境安装助手
echo ========================================
echo.

REM 检查 Node.js
echo [1/4] 检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    echo.
    echo 请先安装 Node.js:
    echo 1. 访问 https://nodejs.org/zh-cn/
    echo 2. 下载并安装 LTS 版本
    echo 3. 安装完成后重新运行此脚本
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js: %NODE_VERSION%

echo.

REM 检查 yt-dlp
echo [2/4] 检查 yt-dlp...
where yt-dlp >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  yt-dlp 未安装
    echo.
    echo 是否现在安装？(Y/N)
    set /p install_ytdlp="> "
    if /i "%install_ytdlp%"=="Y" (
        echo.
        echo 正在安装 yt-dlp...
        pip install yt-dlp
        if %errorlevel% neq 0 (
            echo.
            echo ❌ 安装失败，请手动安装:
            echo 1. 安装 Python: https://www.python.org/downloads/
            echo 2. 运行: pip install yt-dlp
            echo 3. 或下载: https://github.com/yt-dlp/yt-dlp/releases
        ) else (
            echo ✅ yt-dlp 安装成功
        )
    ) else (
        echo ⚠️  跳过 yt-dlp 安装（将使用普通下载方式）
    )
) else (
    for /f "tokens=*" %%i in ('yt-dlp --version') do set YTDLP_VERSION=%%i
    echo ✅ yt-dlp: %YTDLP_VERSION%
)

echo.

REM 检查 ffmpeg
echo [3/4] 检查 ffmpeg...
where ffmpeg >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  ffmpeg 未安装
    echo.
    echo 重要: ffmpeg 用于合并视频和音频，没有它可能导致"有视频无声音"
    echo.
    echo 是否现在安装？(Y/N)
    set /p install_ffmpeg="> "
    if /i "%install_ffmpeg%"=="Y" (
        echo.
        echo 推荐使用 Chocolatey 安装:
        echo choco install ffmpeg
        echo.
        echo 或使用 winget:
        echo winget install ffmpeg
        echo.
        echo 或手动下载: https://ffmpeg.org/download.html
        echo.
        pause
    ) else (
        echo ⚠️  跳过 ffmpeg 安装（可能影响音视频质量）
    )
) else (
    for /f "tokens=*" %%i in ('ffmpeg -version 2^>nul ^| findstr "version"') do set FFMPEG_VERSION=%%i
    echo ✅ ffmpeg: %FFMPEG_VERSION%
)

echo.

REM 安装项目依赖
echo [4/4] 安装项目依赖...
echo.
call npm install
if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ 安装完成！
    echo ========================================
    echo.
    echo 现在可以运行"启动应用.bat"来启动服务器了
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ 依赖安装失败
    echo ========================================
    echo.
    echo 请检查网络连接或使用国内镜像:
    echo npm config set registry https://registry.npmmirror.com
    echo.
)

pause

