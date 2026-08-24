/**
 * ============================================================
 * 视频解析助手 - Express 服务端
 * ============================================================
 * 
 * 代码结构：
 *   1. 依赖导入与配置
 *   2. 下载进度追踪
 *   3. 公告系统 API
 *   4. 登录系统 API (二维码/状态/登出)
 *   5. 视频下载 API
 *   6. 视频解析 API
 *   7. 其他功能 API (收藏夹/批量/封面等)
 *   8. 服务器启动
 * 
 * ============================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const ytdlpService = require('./services/ytdlpService');
const bilibiliService = require('./services/bilibiliService');
const multiPlatformService = require('./services/multiPlatformService');

const app = express();
const PORT = process.env.PORT || 3000;

// 存储数据
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 公告文件路径
const ANNOUNCEMENT_FILE = path.join(DATA_DIR, 'announcement.json');

// 管理员密钥（生产环境应使用环境变量）
const ADMIN_KEY = process.env.ADMIN_KEY || 'your-secret-key';

// 存储登录会话（内存存储，重启会丢失）
const loginSessions = new Map();

// ==================== 下载进度追踪 ====================
const downloadProgress = new Map();

// 更新下载进度（供 bilibiliService 调用）
function updateDownloadProgress(taskId, data) {
    downloadProgress.set(taskId, {
        ...data,
        updatedAt: Date.now()
    });
}

// 清理过期进度（5分钟后自动清理）
setInterval(() => {
    const now = Date.now();
    for (const [taskId, data] of downloadProgress.entries()) {
        if (now - data.updatedAt > 5 * 60 * 1000) {
            downloadProgress.delete(taskId);
        }
    }
}, 60000);

// 导出进度更新函数供其他模块使用
global.updateDownloadProgress = updateDownloadProgress;

// 中间件
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务（前端）- 禁用缓存以确保更新
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));

// ==================== 公告系统 ====================

// 获取公告
app.get('/api/announcement', (req, res) => {
    try {
        if (fs.existsSync(ANNOUNCEMENT_FILE)) {
            const data = JSON.parse(fs.readFileSync(ANNOUNCEMENT_FILE, 'utf8'));
            res.json({ success: true, content: data.content || '' });
        } else {
            res.json({ success: true, content: '' });
        }
    } catch (error) {
        res.json({ success: true, content: '' });
    }
});

// 保存公告（需要管理员密钥）
app.post('/api/announcement', (req, res) => {
    try {
        const { content, adminKey } = req.body;

        if (adminKey !== ADMIN_KEY) {
            return res.status(403).json({ success: false, error: '权限不足' });
        }

        fs.writeFileSync(ANNOUNCEMENT_FILE, JSON.stringify({
            content: content || '',
            updatedAt: new Date().toISOString()
        }));

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==================== 登录系统 ====================

// 获取登录二维码
app.get('/api/bilibili/qrcode', async (req, res) => {
    try {
        const response = await axios.get('https://passport.bilibili.com/x/passport-login/web/qrcode/generate', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        });

        if (response.data.code === 0) {
            const { url, qrcode_key } = response.data.data;

            // 生成二维码图片URL（使用第三方API）
            const qrcodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

            res.json({
                success: true,
                qrcodeUrl: qrcodeUrl,
                qrcodeKey: qrcode_key
            });
        } else {
            throw new Error(response.data.message || '获取二维码失败');
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 检查二维码扫描状态
app.get('/api/bilibili/qrcode/check', async (req, res) => {
    try {
        const { key } = req.query;

        if (!key) {
            return res.status(400).json({ success: false, error: '缺少qrcode_key' });
        }

        const response = await axios.get(`https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${key}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/'
            }
        });

        const data = response.data.data;
        let status = 'waiting';
        let userInfo = null;
        let isVip = false;
        let cookies = null;

        switch (data.code) {
            case 0: // 登录成功
                status = 'confirmed';
                // 从URL中提取cookie参数
                const urlParams = new URLSearchParams(data.url.split('?')[1]);
                const sessdata = urlParams.get('SESSDATA');
                const biliJct = urlParams.get('bili_jct');
                const dedeUserId = urlParams.get('DedeUserID');

                if (sessdata) {
                    cookies = {
                        SESSDATA: sessdata,
                        bili_jct: biliJct,
                        DedeUserID: dedeUserId
                    };

                    // 获取用户信息
                    try {
                        const userResponse = await axios.get('https://api.bilibili.com/x/web-interface/nav', {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                                'Cookie': `SESSDATA=${sessdata}; bili_jct=${biliJct}; DedeUserID=${dedeUserId}`
                            }
                        });

                        if (userResponse.data.code === 0) {
                            const userData = userResponse.data.data;
                            userInfo = {
                                name: userData.uname,
                                avatar: userData.face,
                                mid: userData.mid
                            };
                            isVip = userData.vipStatus === 1;
                        }
                    } catch (e) {
                        console.error('获取用户信息失败:', e.message);
                    }

                    // 存储会话
                    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    loginSessions.set(sessionId, {
                        cookies,
                        userInfo,
                        isVip,
                        createdAt: Date.now()
                    });

                    // 设置cookie
                    res.cookie('bili_session', sessionId, {
                        httpOnly: true,
                        maxAge: 7 * 24 * 60 * 60 * 1000 // 7天
                    });
                }
                break;
            case 86038: // 二维码已过期
                status = 'expired';
                break;
            case 86090: // 已扫码未确认
                status = 'scanned';
                break;
            case 86101: // 未扫码
                status = 'waiting';
                break;
        }

        res.json({
            success: true,
            status,
            userInfo,
            isVip
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 检查登录状态
app.get('/api/bilibili/status', (req, res) => {
    try {
        const sessionId = req.cookies?.bili_session;

        if (sessionId && loginSessions.has(sessionId)) {
            const session = loginSessions.get(sessionId);
            res.json({
                success: true,
                isLoggedIn: true,
                isVip: session.isVip,
                userInfo: session.userInfo
            });
        } else {
            res.json({
                success: true,
                isLoggedIn: false
            });
        }
    } catch (error) {
        res.json({ success: true, isLoggedIn: false });
    }
});

// 退出登录
app.post('/api/bilibili/logout', (req, res) => {
    try {
        const sessionId = req.cookies?.bili_session;

        if (sessionId) {
            loginSessions.delete(sessionId);
            res.clearCookie('bili_session');
        }

        res.json({ success: true });
    } catch (error) {
        res.json({ success: true });
    }
});

// ==================== 视频下载 API ====================

// 视频下载（支持画质选择）
app.get('/api/bilibili/download', async (req, res) => {
    try {
        const { url, qn = 80, format = 'mp4', nameFormat = 'title' } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        console.log('视频下载请求:', { url, qn, format, nameFormat, hasLogin: !!cookies });

        // 生成任务ID用于进度追踪
        const taskId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 初始化进度
        updateDownloadProgress(taskId, {
            status: 'starting',
            percent: 0,
            stage: '准备中...',
            videoPercent: 0,
            audioPercent: 0
        });

        // 使用bilibiliService下载（支持格式和命名，传递taskId）
        await bilibiliService.downloadWithQuality(url, parseInt(qn), cookies, res, format, nameFormat, taskId);

    } catch (error) {
        console.error('下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// 获取下载进度
app.get('/api/download-progress/:taskId', (req, res) => {
    const { taskId } = req.params;
    const progress = downloadProgress.get(taskId);

    if (progress) {
        res.json({ success: true, data: progress });
    } else {
        res.json({ success: true, data: { status: 'unknown', percent: 0 } });
    }
});

// 取消下载任务
app.post('/api/cancel-download/:taskId', (req, res) => {
    const { taskId } = req.params;

    try {
        // 调用 bilibiliService 取消下载
        const cancelled = bilibiliService.cancelDownload(taskId);

        // 无论是否找到任务，都在进度 Map 中标记为已取消
        downloadProgress.set(taskId, {
            status: 'cancelled',
            stage: 'cancelled',
            percent: 0,
            message: '下载已取消',
            updatedAt: Date.now()
        });

        res.json({ success: true, cancelled });
    } catch (error) {
        console.error('取消下载失败:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 创建下载任务（返回 taskId 供前端轮询）
app.post('/api/bilibili/download-task', async (req, res) => {
    try {
        const { url, qn = 80, format = 'mp4', nameFormat = 'title' } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        // 生成任务ID
        const taskId = `download_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // 初始化进度
        updateDownloadProgress(taskId, {
            status: 'starting',
            percent: 0,
            stage: '准备中...',
            videoPercent: 0,
            audioPercent: 0
        });

        // 返回 taskId 给前端
        res.json({ success: true, taskId });

        // 异步开始下载任务
        // 注意：bilibiliService 内部会设置完成状态（包含 downloadUrl 和 fileName）
        // 这里只需要处理未预期的错误
        bilibiliService.downloadWithQualityAsync(url, parseInt(qn), cookies, format, nameFormat, taskId)
            .then((filePath) => {
                // 如果service没有设置完成状态，这里补充设置（正常情况下不会执行到这里）
                const currentProgress = downloadProgress.get(taskId);
                if (!currentProgress || currentProgress.status !== 'completed') {
                    const path = require('path');
                    updateDownloadProgress(taskId, {
                        status: 'completed',
                        percent: 100,
                        stage: '下载完成',
                        filePath,
                        fileName: path.basename(filePath),
                        downloadUrl: `/api/download-file/${encodeURIComponent(path.basename(filePath))}`
                    });
                }
            })
            .catch((error) => {
                updateDownloadProgress(taskId, {
                    status: 'error',
                    percent: 0,
                    stage: '下载失败',
                    error: error.message
                });
            });

    } catch (error) {
        console.error('创建下载任务错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 下载已完成的文件（供前端异步下载任务使用）
app.get('/api/download-file/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const os = require('os');
        const downloadDir = path.join(os.tmpdir(), 'bilibili-downloads');
        const filePath = path.join(downloadDir, decodeURIComponent(filename));

        // 安全检查：确保文件在下载目录内
        if (!filePath.startsWith(downloadDir)) {
            return res.status(403).json({ success: false, error: '访问被拒绝' });
        }

        // 检查文件是否存在
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, error: '文件不存在或已过期' });
        }

        const stats = fs.statSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.mp4': 'video/mp4',
            '.mkv': 'video/x-matroska',
            '.webm': 'video/webm',
            '.flv': 'video/x-flv',
            '.mp3': 'audio/mpeg',
            '.m4a': 'audio/mp4'
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        // 下载完成后清理文件（延迟5秒）
        fileStream.on('end', () => {
            setTimeout(() => {
                try { fs.unlinkSync(filePath); } catch (e) { }
            }, 5000);
        });

    } catch (error) {
        console.error('文件下载错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 音频下载（支持画质选择）
app.get('/api/bilibili/download/audio', async (req, res) => {
    try {
        const { url, qn = 80 } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        console.log('音频下载请求:', { url, qn, hasLogin: !!cookies });

        // 使用bilibiliService下载音频
        await bilibiliService.downloadAudio(url, parseInt(qn), cookies, res);

    } catch (error) {
        console.error('音频下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// ==================== 其他功能 API ====================

// 收藏夹处理
app.get('/api/bilibili/favorites', async (req, res) => {
    try {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, error: '请提供收藏夹ID' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        // 使用multiPlatformService处理收藏夹
        const result = await multiPlatformService.parseBilibiliFavorites(id, cookies);

        res.json(result);

    } catch (error) {
        console.error('收藏夹处理错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 用户投稿处理
app.get('/api/bilibili/user-videos', async (req, res) => {
    try {
        const { uid } = req.query;

        if (!uid) {
            return res.status(400).json({ success: false, error: '请提供用户UID' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        console.log('处理用户投稿:', { uid, hasLogin: !!cookies });

        // 使用multiPlatformService处理用户投稿
        const result = await multiPlatformService.parseBilibiliUserVideos(uid, cookies);

        res.json(result);

    } catch (error) {
        console.error('用户投稿处理错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 批量处理接口
app.post('/api/parse/batch', async (req, res) => {
    try {
        const { urls } = req.body;

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({ success: false, error: '请提供视频链接数组' });
        }

        if (urls.length > 50) {
            return res.status(400).json({ success: false, error: '单次最多处理50个链接' });
        }

        console.log('批量处理请求:', urls.length, '个链接');

        // 使用multiPlatformService批量处理
        const results = await multiPlatformService.parseMultiple(urls);

        res.json({
            success: true,
            total: urls.length,
            results: results
        });

    } catch (error) {
        console.error('批量处理错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 封面下载
app.get('/api/bilibili/download/cover', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        console.log('封面下载请求:', { url });

        // 使用bilibiliService下载封面
        await bilibiliService.downloadCover(url, res);

    } catch (error) {
        console.error('封面下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// 视频下载（无音频）
app.get('/api/bilibili/download/video-only', async (req, res) => {
    try {
        const { url, qn = 80 } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        console.log('视频（无音频）下载请求:', { url, qn, hasLogin: !!cookies });

        // 使用bilibiliService下载视频（无音频）
        await bilibiliService.downloadVideoOnly(url, parseInt(qn), cookies, res);

    } catch (error) {
        console.error('视频（无音频）下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// 获取视频/音频直接下载链接
app.get('/api/bilibili/direct-links', async (req, res) => {
    try {
        const { url, qn = 80 } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        console.log('获取视频直接链接:', { url, qn, hasLogin: !!cookies });

        const links = await bilibiliService.getDirectLinks(url, parseInt(qn), cookies);
        res.json({ success: true, data: links });

    } catch (error) {
        console.error('获取直接链接错误:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 流式代理下载（单独视频或音频，不合并）
app.get('/api/bilibili/stream', async (req, res) => {
    try {
        const { url, qn = 80, type = 'video', format } = req.query;

        if (!url) {
            return res.status(400).json({ success: false, error: '请提供视频链接' });
        }

        // 获取用户cookies（如果已登录）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        console.log('流式代理下载:', { url, qn, type, format, hasLogin: !!cookies });

        // 获取直接链接
        const links = await bilibiliService.getDirectLinks(url, parseInt(qn), cookies);

        const targetUrl = type === 'audio' ? links.audioUrl : links.videoUrl;
        if (!targetUrl) {
            return res.status(400).json({ success: false, error: `无法获取${type === 'audio' ? '音频' : '视频'}链接` });
        }

        // 如果指定了格式，进行转换；否则使用原始格式
        const ext = format || (type === 'audio' ? 'm4a' : 'm4s');
        const filename = `${links.title}_${type}.${ext}`;

        if (format && format !== (type === 'audio' ? 'm4a' : 'm4s')) {
            // 需要格式转换
            console.log(`开始格式转换: ${type} -> ${format}`);
            await bilibiliService.streamWithFormat(targetUrl, res, filename, type, format);
        } else {
            // 直接代理（原始格式）
            console.log(`直接代理下载: ${filename}`);
            await bilibiliService.streamProxy(targetUrl, res, filename);
        }

    } catch (error) {
        console.error('流式代理下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

// ==================== 视频处理 ====================

app.post('/api/parse', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: '请提供视频链接'
            });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: '无效的视频链接'
            });
        }

        // 获取用户登录信息（如果是视频）
        let cookies = null;
        const sessionId = req.cookies?.bili_session;
        if (sessionId && loginSessions.has(sessionId)) {
            cookies = loginSessions.get(sessionId).cookies;
        }

        // 处理视频（优先使用多平台服务）
        let result;
        if (url.includes('bilibili.com') || url.includes('b23.tv')) {
            // 视频，使用专门的服务（支持登录）
            if (cookies) {
                result = await bilibiliService.parseVideo(url, cookies);
            } else {
                result = await bilibiliService.parseVideo(url);
            }
            result.platform = '视频';
        } else {
            // 其他平台，使用多平台处理服务
            try {
                result = await multiPlatformService.parseVideo(url);
            } catch (multiError) {
                console.log('多平台服务失败:', multiError.message);
                throw new Error(`视频处理失败: ${multiError.message}`);
            }
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('处理错误:', error);
        res.status(500).json({
            success: false,
            error: error.message || '处理失败，请稍后重试'
        });
    }
});

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
});

// 获取支持的平台列表
app.get('/api/platforms', (req, res) => {
    try {
        const platforms = multiPlatformService.getSupportedPlatforms();
        res.json({
            success: true,
            platforms: platforms
        });
    } catch (error) {
        res.json({
            success: true,
            platforms: []
        });
    }
});

// 检查 yt-dlp 是否可用
app.get('/api/ytdlp/check', async (req, res) => {
    try {
        const check = await ytdlpService.checkAvailable();
        res.json({
            success: true,
            available: check.available,
            version: check.version || null,
            command: check.command || null,
            ffmpegAvailable: check.ffmpegAvailable || false,
            error: check.error || null
        });
    } catch (error) {
        res.json({
            success: false,
            available: false,
            error: error.message
        });
    }
});

// 使用 yt-dlp 获取视频信息
app.post('/api/ytdlp/info', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: '请提供视频链接'
            });
        }

        const info = await ytdlpService.getVideoInfo(url);

        res.json({
            success: true,
            data: {
                title: info.title,
                author: info.uploader || info.channel || '未知',
                duration: info.duration ? ytdlpService.formatDuration(info.duration) : '00:00',
                thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
                formats: info.formats || []
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 使用 yt-dlp 下载视频
app.get('/api/ytdlp/download', async (req, res) => {
    try {
        let { url, format = 'best' } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: '请提供视频链接'
            });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: '无效的视频链接'
            });
        }

        console.log('使用 yt-dlp 下载视频:', url, '格式:', format);

        // 检测是否是视频链接
        const isBilibili = url.includes('bilibili.com') || url.includes('b23.tv');

        if (isBilibili) {
            // 视频使用专用下载方法
            console.log('检测到视频链接，使用专用下载方法...');
            try {
                await bilibiliService.downloadAndMerge(url, res);
                return;
            } catch (biliError) {
                console.error('专用下载失败:', biliError.message);
                console.log('尝试使用 yt-dlp 作为备用...');
            }
        }

        // 检查 yt-dlp 是否可用
        const check = await ytdlpService.checkAvailable();
        if (!check.available) {
            return res.status(503).json({
                success: false,
                error: '服务器未配置此下载功能。请使用普通下载按钮或联系管理员。'
            });
        }

        // 下载并流式传输
        await ytdlpService.downloadVideoStream(url, format, res);

    } catch (error) {
        console.error('yt-dlp 下载错误:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || '下载失败，请稍后重试'
            });
        }
    }
});

// 图片代理（解决防盗链问题）
app.get('/api/proxy/image', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).send('Missing url parameter');
        }

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.bilibili.com/',
                'Accept': 'image/*,*/*'
            }
        });

        res.setHeader('Content-Type', response.headers['content-type'] || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        response.data.pipe(res);

    } catch (error) {
        console.error('图片代理错误:', error.message);
        res.status(500).send('Failed to load image');
    }
});

// 视频下载代理
app.get('/api/download', async (req, res) => {
    try {
        const { url, filename } = req.query;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: '请提供视频链接'
            });
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({
                success: false,
                error: '无效的视频链接'
            });
        }

        console.log('开始下载视频:', url);

        const videoFilename = filename || `video_${Date.now()}.mp4`;

        const isBilibiliCdn = url.includes('bilivideo.') ||
            url.includes('akamaized.net') ||
            url.includes('bilibili.com') ||
            url.includes('hdslb.com');
        const referer = isBilibiliCdn ? 'https://www.bilibili.com/' : new URL(url).origin;

        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
            timeout: 300000,
            maxRedirects: 5,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Referer': referer,
                'Origin': isBilibiliCdn ? 'https://www.bilibili.com' : undefined
            }
        });

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(videoFilename)}"`);
        res.setHeader('Content-Type', response.headers['content-type'] || 'video/mp4');

        if (response.headers['content-length']) {
            res.setHeader('Content-Length', response.headers['content-length']);
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        response.data.pipe(res);

    } catch (error) {
        console.error('下载错误:', error.message);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: error.message || '下载失败'
            });
        }
    }
});

// ==================== 网易云音乐API代理 ====================
// 注意：这里使用公开的网易云音乐API服务，实际部署时建议自建API服务

// 搜索音乐
app.get('/api/music/search', async (req, res) => {
    try {
        const { keywords, limit = 30, offset = 0 } = req.query;
        if (!keywords) {
            return res.json({ success: false, error: '缺少关键词参数' });
        }

        // 使用公开的网易云音乐API服务（示例）
        // 实际使用时需要替换为真实的API地址或自建服务
        const apiUrl = `https://netease-cloud-music-api-five-rust.vercel.app/search?keywords=${encodeURIComponent(keywords)}&limit=${limit}&offset=${offset}`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://music.163.com/'
            },
            timeout: 10000
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('搜索音乐失败:', error.message);
        res.json({
            success: false,
            error: error.message || '搜索失败',
            // 返回示例数据作为fallback
            data: {
                result: {
                    songs: []
                }
            }
        });
    }
});

// 获取歌曲详情（包括播放URL）
app.get('/api/music/song', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.json({ success: false, error: '缺少歌曲ID参数' });
        }

        // 获取歌曲详情和播放URL
        const apiUrl = `https://netease-cloud-music-api-five-rust.vercel.app/song/url/v1?id=${id}&level=exhigh`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://music.163.com/'
            },
            timeout: 10000
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('获取歌曲失败:', error.message);
        res.json({ success: false, error: error.message || '获取歌曲失败' });
    }
});

// 获取歌词
app.get('/api/music/lyric', async (req, res) => {
    try {
        const { id } = req.query;
        if (!id) {
            return res.json({ success: false, error: '缺少歌曲ID参数' });
        }

        const apiUrl = `https://netease-cloud-music-api-five-rust.vercel.app/lyric?id=${id}`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://music.163.com/'
            },
            timeout: 10000
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('获取歌词失败:', error.message);
        res.json({ success: false, error: error.message || '获取歌词失败' });
    }
});

// 获取歌曲详情信息
app.get('/api/music/detail', async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            return res.json({ success: false, error: '缺少歌曲ID参数' });
        }

        const apiUrl = `https://netease-cloud-music-api-five-rust.vercel.app/song/detail?ids=${ids}`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://music.163.com/'
            },
            timeout: 10000
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('获取歌曲详情失败:', error.message);
        res.json({ success: false, error: error.message || '获取歌曲详情失败' });
    }
});

// 所有其他路由返回前端页面
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 验证 URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📱 API 端点: http://localhost:${PORT}/api/parse`);
    console.log(`🔐 管理员密钥: ${ADMIN_KEY}`);
});

// 错误处理
process.on('unhandledRejection', (err) => {
    console.error('未处理的 Promise 拒绝:', err);
});

process.on('uncaughtException', (err) => {
    console.error('未捕获的异常:', err);
    process.exit(1);
});
