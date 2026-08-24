/**
 * ============================================================
 * 视频解析助手 - 前端主脚本
 * ============================================================
 * 
 * 代码结构：
 *   1. 配置与全局状态
 *   2. DOM 元素获取
 *   3. 初始化
 *   4. 预设选项功能
 *   5. 下载进度与任务管理
 *   6. 视频解析功能
 *   7. 登录系统
 *   8. 播放器功能
 *   9. 设置与历史记录
 *  10. UI 工具函数 (Toast/Modal等)
 * 
 * ============================================================
 */

// ==================== 1. 配置与全局状态 ====================

// API 配置
const API_BASE_URL = window.location.origin;

// GitHub Gist 公告配置
const GIST_CONFIG = {
    username: 'YiQing-House',
    gistId: 'ae97ddcecaaf2f3dea622ef7b2520c67',
    filename: 'gistfile1.txt',
    enabled: true
};

// 全局状态（适配新 HTML）
let appState = {
    format: 'video+audio',
    quality: 80,
    videoFormat: 'mp4',
    audioFormat: 'mp3',
    theme: 'dark',
    filenameFormat: localStorage.getItem('filename_format') || 'title'
};

// 兼容旧代码的全局变量
let currentVideoData = null;
let currentData = null; // 新 HTML 使用这个
let selectedQuality = null;
let selectedFormat = 'video+audio';
let isLoggedIn = false;
let isVip = false;
let userInfo = null;
let qrCheckInterval = null;
let batchResults = []; // 批量处理结果
let gistAnnouncementData = null; // Gist 公告数据

// 预设选项（兼容）
let presetFormat = 'video+audio';
let presetQuality = 80;
let presetOutput = 'mp4'; // mp4, mp3, flac

// 设置
let appSettings = {
    theme: 'auto',
    filenameFormat: 'title',
    autoDownload: false,
    showQualityTip: true,
    rememberQuality: true
};

// DOM 元素
const videoUrlInput = document.getElementById('videoUrl');
const parseBtn = document.getElementById('parseBtn');
const loadingSection = document.getElementById('loadingSection');
const resultSection = document.getElementById('resultSection');

// 新 HTML 使用的 DOM 元素（可能不存在，需要检查）
let batchSection = null;
let batchList = null;
let batchCount = null;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化新 HTML 的 DOM 元素
    batchSection = document.getElementById('batchSection');
    batchList = document.getElementById('batchList');
    batchCount = document.getElementById('batchCount');

    // 加载设置
    loadSettings();

    // 应用主题
    applyTheme();

    // 初始化新 HTML 的 UI
    initUI();

    // 初始化背景图
    initBackgroundImage();

    // 绑定事件
    if (parseBtn) parseBtn.addEventListener('click', handleSmartParse);
    if (videoUrlInput) {
        videoUrlInput.addEventListener('keydown', (e) => {
            // Ctrl+Enter 触发处理
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleSmartParse();
            }
        });
    }

    // 输入内容变化时更新提示
    if (videoUrlInput) {
        videoUrlInput.addEventListener('input', updateInputHint);
        videoUrlInput.addEventListener('paste', () => {
            setTimeout(updateInputHint, 100);
        });
    }

    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            if (videoUrlInput) videoUrlInput.focus();
        });
    }

    // 加载 Gist 公告
    checkAnnouncement(); // 新 HTML 使用这个函数

    // 检查登录状态
    checkLoginStatus();
    checkLogin(); // 新 HTML 使用这个函数

    // 加载历史记录到下拉菜单
    loadHistoryToDropdown();

    // 初始化预设选项
    initPresetOptions();
    updatePresetVipStatus();

    // 窗口大小改变时重新计算指示器位置
    window.addEventListener('resize', () => {
        const activeQ = document.querySelector('#qualitySegment .segment-opt.active');
        if (activeQ) moveGlider(document.getElementById('qualitySegment'), activeQ);
    });

    // 点击外部关闭历史记录下拉菜单
    document.addEventListener('click', (e) => {
        const historyDropdown = document.getElementById('historyDropdown');
        const historyTrigger = document.querySelector('.history-trigger');
        if (historyDropdown && historyTrigger) {
            if (!e.target.closest('.history-dropdown') && !e.target.closest('.history-trigger')) {
                historyDropdown.classList.remove('active');
            }
        }
    });

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (appState.theme === 'auto') {
            applyTheme();
        }
    });
});

// ==================== 预设选项功能 ====================

function initPresetOptions() {
    // 恢复保存的预设
    // 不再从本地存储恢复，保持默认 1080P（80）和完整模式
    presetFormat = 'video+audio';
    presetQuality = 80;
    const formatBtn = document.querySelector(`#formatGroup .preset-item[data-format="video+audio"]`);
    const qualityBtn = document.querySelector(`#qualityGroup .preset-item[data-qn="80"]`);
    if (formatBtn) {
        document.querySelectorAll('#formatGroup .preset-item').forEach(btn => btn.classList.remove('active'));
        formatBtn.classList.add('active');
    }
    if (qualityBtn) {
        document.querySelectorAll('#qualityGroup .preset-item').forEach(btn => btn.classList.remove('active'));
        qualityBtn.classList.add('active');
    }
    appState.format = 'video+audio';
    appState.quality = 80;
    updatePresetVisibility();
    updatePresetInfoDisplay();
}

function selectPresetFormat(format, element) {
    presetFormat = format;
    localStorage.setItem('presetFormat', format);

    // 更新按钮状态
    document.querySelectorAll('#formatGroup .preset-item').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');

    updatePresetVisibility();
    updatePresetInfoDisplay();
}

function selectPresetQuality(qn, element) {
    // 检查是否需要登录
    const needVip = qn > 80;
    if (needVip && !isLoggedIn) {
        showToast('请先登录网站账号', 'error');
        showLoginModal();
        return;
    }
    if (needVip && !isVip) {
        showToast('此画质需要大会员', 'error');
        return;
    }

    presetQuality = qn;
    localStorage.setItem('presetQuality', qn);

    // 更新按钮状态
    document.querySelectorAll('#qualityGroup .preset-item').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');
    updatePresetInfoDisplay();
}

// 选择预设输出格式（mp4, mp3, flac）
function selectPresetOutput(output, element) {
    presetOutput = output;
    localStorage.setItem('presetOutput', output);

    // 更新按钮状态
    const outputGroup = document.getElementById('outputGroup');
    if (outputGroup) {
        outputGroup.querySelectorAll('.preset-item').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    if (element) {
        element.classList.add('active');
    }

    updatePresetInfoDisplay();
}

function updatePresetVisibility() {
    const qualityGroup = document.getElementById('qualityPresetGroup');

    if (presetFormat === 'cover' || presetFormat === 'audio') {
        // 封面和音频不需要画质选择
        if (qualityGroup) qualityGroup.style.display = 'none';
    } else {
        if (qualityGroup) qualityGroup.style.display = 'block';
    }
}

function updatePresetVipStatus() {
    const vipBtns = document.querySelectorAll('.preset-item.vip');
    vipBtns.forEach(btn => {
        if (isLoggedIn && isVip) {
            btn.classList.add('unlocked');
        } else {
            btn.classList.remove('unlocked');
        }
    });
}

// 更新预设信息显示
function updatePresetInfoDisplay() {
    const infoEl = document.getElementById('currentPresetInfo');
    if (!infoEl) return;

    const formatNames = {
        'video+audio': '完整视频',
        'video+audio-separate': '视频+音频分离',
        'audio': '仅音频',
        'video-only': '仅视频',
        'cover': '封面'
    };

    const qualityNames = {
        120: '4K',
        116: '1080P高帧率',   // 整合60帧和高码率
        112: '1080P高帧率',
        80: '1080P',
        64: '720P',
        32: '480P'
    };

    const formatName = formatNames[presetFormat] || '完整视频';
    const qualityName = qualityNames[presetQuality] || '1080P';

    if (presetFormat === 'cover' || presetFormat === 'audio') {
        infoEl.textContent = formatName;
    } else {
        infoEl.textContent = `${formatName} · ${qualityName}`;
    }
}

// 执行下载（HTML 按钮调用此函数）
function executeDownload() {
    console.log('🔴 executeDownload 被调用');
    downloadWithPreset();
}

// 使用预设下载（单视频）
async function downloadWithPreset() {
    console.log('🔵 downloadWithPreset 开始执行');
    console.log('🔵 currentVideoData:', currentVideoData);
    if (!currentVideoData) {
        showToast('请先处理视频', 'error');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备下载...';

    try {
        const videoUrl = videoUrlInput.value.trim();
        const title = (currentVideoData.title || 'video').replace(/[<>:"/\\|?*]/g, '_');
        const author = (currentVideoData.author || 'UP主').replace(/[<>:"/\\|?*]/g, '_');
        const encodedUrl = encodeURIComponent(videoUrl);
        const qn = presetQuality || 80;
        const maxQ = currentVideoData.maxQuality || 80;

        // 画质名称映射
        const qNameMap = {
            120: '4K', 116: '1080P高帧率', 112: '1080P高帧率', 80: '1080P', 64: '720P', 32: '480P', 16: '360P'
        };
        // 实际下载画质
        const actualQn = qn > maxQ ? maxQ : qn;
        const qualityName = qNameMap[actualQn] || actualQn;

        // 根据命名格式生成文件名（画质在第一位）
        const filenameFormat = appState.filenameFormat || 'title';
        let baseName;
        switch (filenameFormat) {
            case 'title-author':
                baseName = `${title} - ${author}`;
                break;
            case 'author-title':
                baseName = `${author} - ${title}`;
                break;
            default:
                baseName = title;
        }
        const finalName = `${qualityName}_${baseName}`;

        // 根据预设格式执行下载
        if (presetFormat === 'cover') {
            if (!currentVideoData.thumbnail) {
                showToast('该视频没有封面', 'error');
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = originalText;
                return;
            }
            const downloadUrl = `${API_BASE_URL}/api/bilibili/download/cover?url=${encodedUrl}`;
            triggerBrowserDownload(downloadUrl, `${baseName}.jpg`);
        } else if (presetFormat === 'video+audio-separate') {
            showToast('开始分离下载，将依次下载视频和音频...', 'success');
            const videoDownloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${qn}&type=video`;
            triggerBrowserDownload(videoDownloadUrl, `${finalName}_video.m4s`);
            setTimeout(() => {
                const audioDownloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${qn}&type=audio`;
                triggerBrowserDownload(audioDownloadUrl, `${finalName}_audio.m4a`);
            }, 1000);
        } else {
            // 完整视频：使用异步任务下载并显示进度
            console.log('🔵 开始异步下载任务');
            try {
                await downloadWithAsyncTask(videoUrl, qn, filenameFormat, `${finalName}.mp4`);
            } catch (downloadError) {
                console.error('异步下载失败:', downloadError);
                showToast(`下载失败: ${downloadError.message}`, 'error');
            }
            return; // 异步下载完成，直接返回
        }

        showToast('下载请求已发送，请等待浏览器下载提示', 'success');

    } catch (error) {
        showToast('下载失败: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
        }, 2000);
    }
}

// 触发浏览器下载（简单方式，无进度）
function triggerBrowserDownload(url, filename) {
    console.log('🔽 triggerBrowserDownload:', url, filename);

    // 确保 URL 是完整的
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    console.log('🔽 完整下载 URL:', fullUrl);

    // 方法1：使用 <a> 标签
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = filename;
    link.style.display = 'none';
    link.target = '_blank'; // 添加新窗口打开作为备选
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
        document.body.removeChild(link);
    }, 1000);

    // 显示提示
    showToast(`📥 正在下载: ${filename}`, 'info');
}

/**
 * 使用后端异步任务下载（支持批量下载，同步后端处理进度）
 * @param {string} videoUrl - 视频 URL（原始 B站 URL）
 * @param {string} displayFilename - 显示的文件名
 * @param {number} qn - 画质
 * @param {string} format - 输出格式
 * @param {string} type - 下载类型 (video/audio/merge)
 * @returns {Promise<{success: boolean, taskId: string}>}
 */
async function downloadWithBackendTask(videoUrl, displayFilename, qn = 80, format = 'mp4', type = 'merge') {
    // 生成前端任务 ID
    const frontendTaskId = `backend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let backendTaskId = null;
    let pollingTimer = null;

    console.log('📥 开始后端异步下载任务:', { videoUrl, displayFilename, qn, format, type });

    try {
        // 先添加到下载列表，显示"提交中..."
        addDownloadTask(frontendTaskId, displayFilename, videoUrl);
        updateDownloadTask(frontendTaskId, { status: 'starting', stage: '提交任务中...', percent: 0 });

        // 1. 创建后端下载任务
        const response = await fetch(`${API_BASE_URL}/api/bilibili/download-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                url: videoUrl,
                qn: qn,
                format: format,
                nameFormat: 'title',
                type: type  // video/audio/merge
            })
        });

        if (!response.ok) {
            throw new Error('创建下载任务失败');
        }

        const result = await response.json();
        if (!result.success || !result.taskId) {
            throw new Error(result.error || '创建下载任务失败');
        }

        backendTaskId = result.taskId;
        console.log('📋 后端任务已创建:', backendTaskId);

        // 更新状态
        updateDownloadTask(frontendTaskId, { status: 'processing', stage: '任务已创建...', percent: 0 });

        // 2. 开始轮询后端进度
        return new Promise((resolve, reject) => {
            pollingTimer = setInterval(async () => {
                try {
                    const progressRes = await fetch(`${API_BASE_URL}/api/download-progress/${backendTaskId}`);
                    const progressData = await progressRes.json();

                    if (!progressData.success) {
                        return; // 继续等待
                    }

                    const data = progressData.data;

                    // 翻译阶段名称
                    let stageName = data.stage || '处理中...';
                    if (data.stage === 'video') stageName = '下载视频中...';
                    else if (data.stage === 'audio') stageName = '下载音频中...';
                    else if (data.stage === 'merging') stageName = '合并音视频中...';
                    else if (data.stage === 'completed') stageName = '已完成';
                    else if (data.message) stageName = data.message;

                    // 构建进度显示
                    let displayStage = stageName;
                    if (data.downloadedMB && data.totalMB) {
                        displayStage = `${stageName} (${data.downloadedMB}/${data.totalMB}MB)`;
                    }
                    if (data.speed && data.speed !== '0 MB/s') {
                        displayStage += ` ${data.speed}`;
                    }

                    // 更新前端任务状态
                    updateDownloadTask(frontendTaskId, {
                        status: data.status === 'completed' ? 'completed' : 'downloading',
                        stage: displayStage,
                        percent: data.percent || 0,
                        speed: data.speed || '-- MB/s'
                    });

                    // 检查完成状态
                    if (data.status === 'completed') {
                        clearInterval(pollingTimer);
                        pollingTimer = null;

                        const downloadUrl = data.downloadUrl;
                        const fileName = data.fileName || displayFilename;

                        console.log('✅ 后端处理完成:', { downloadUrl, fileName });

                        // 触发浏览器下载
                        if (downloadUrl) {
                            triggerBrowserDownload(downloadUrl, fileName);
                            updateDownloadTask(frontendTaskId, {
                                status: 'completed',
                                stage: '已完成',
                                percent: 100
                            });
                        }

                        resolve({ success: true, taskId: frontendTaskId });
                    } else if (data.status === 'error') {
                        clearInterval(pollingTimer);
                        pollingTimer = null;
                        updateDownloadTask(frontendTaskId, {
                            status: 'error',
                            stage: data.error || '下载失败',
                            percent: 0
                        });
                        reject(new Error(data.error || '下载失败'));
                    } else if (data.status === 'cancelled') {
                        clearInterval(pollingTimer);
                        pollingTimer = null;
                        updateDownloadTask(frontendTaskId, {
                            status: 'cancelled',
                            stage: '已取消',
                            percent: 0
                        });
                        reject(new Error('下载已取消'));
                    }

                } catch (pollError) {
                    console.error('轮询后端进度失败:', pollError);
                }
            }, 800); // 每 800ms 轮询一次

            // 保存轮询信息以便取消
            const task = downloadTasks.get(frontendTaskId);
            if (task) {
                task.backendTaskId = backendTaskId;
                task.pollingTimer = pollingTimer;
                downloadTasks.set(frontendTaskId, task);
            }

            // 设置超时（15分钟）
            setTimeout(() => {
                if (pollingTimer) {
                    clearInterval(pollingTimer);
                    pollingTimer = null;
                    updateDownloadTask(frontendTaskId, { status: 'error', stage: '处理超时' });
                    reject(new Error('下载超时'));
                }
            }, 15 * 60 * 1000);
        });

    } catch (error) {
        console.error('后端任务失败:', error);
        updateDownloadTask(frontendTaskId, { status: 'error', stage: error.message });
        if (pollingTimer) {
            clearInterval(pollingTimer);
        }
        throw error;
    }
}


// 带任务进度追踪的下载（使用 XHR，支持批量下载进度同步）
function downloadWithTaskProgress(url, filename, taskId) {
    return new Promise((resolve, reject) => {
        console.log('📥 downloadWithTaskProgress 开始:', { taskId, filename, url });

        const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
        const startTime = Date.now();
        let lastUpdate = Date.now();
        let lastBytes = 0;

        const xhr = new XMLHttpRequest();
        xhr.open('GET', fullUrl, true);
        xhr.responseType = 'blob';
        xhr.withCredentials = true;

        // 进度事件
        xhr.onprogress = function (event) {
            // 🔧 检查是否被暂停或取消
            const task = downloadTasks.get(taskId);
            if (task && (task.status === 'cancelled' || task.status === 'paused')) {
                xhr.abort();
                return;
            }

            const now = Date.now();
            if (now - lastUpdate >= 300) {  // 每 300ms 更新一次
                const downloadedBytes = event.loaded;
                const totalBytes = event.total || event.loaded;
                const percent = event.lengthComputable ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
                const speedMBps = ((downloadedBytes - lastBytes) / ((now - lastUpdate) / 1000)) / (1024 * 1024);
                const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(1);
                const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);

                // 更新下载任务状态
                updateDownloadTask(taskId, {
                    status: 'downloading',
                    stage: `${downloadedMB}MB / ${totalMB}MB`,
                    percent: percent,
                    speed: `${speedMBps.toFixed(1)} MB/s`
                });

                lastUpdate = now;
                lastBytes = downloadedBytes;
            }
        };


        // 完成事件
        xhr.onload = function () {
            if (xhr.status === 200) {
                const blob = xhr.response;
                const blobUrl = URL.createObjectURL(blob);

                // 触发保存
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);

                const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
                const finalSize = (blob.size / (1024 * 1024)).toFixed(2);

                // 更新任务为完成状态
                updateDownloadTask(taskId, {
                    status: 'completed',
                    stage: `已完成 (${finalSize}MB, ${totalTime}s)`,
                    percent: 100
                });

                console.log(`✅ 下载完成: ${filename} - ${finalSize}MB (${totalTime}s)`);
                resolve({ success: true, size: finalSize, time: totalTime });
            } else {
                updateDownloadTask(taskId, {
                    status: 'error',
                    stage: `HTTP ${xhr.status}`,
                    percent: 0
                });
                reject(new Error(`下载失败: HTTP ${xhr.status}`));
            }
        };

        // 错误事件
        xhr.onerror = function () {
            updateDownloadTask(taskId, {
                status: 'error',
                stage: '网络错误',
                percent: 0
            });
            reject(new Error('下载失败: 网络错误'));
        };

        // 取消事件
        xhr.onabort = function () {
            updateDownloadTask(taskId, {
                status: 'cancelled',
                stage: '已取消',
                percent: 0
            });
            reject(new Error('下载已取消'));
        };

        // 保存 XHR 引用以便取消
        const task = downloadTasks.get(taskId);
        if (task) {
            task.xhr = xhr;
            downloadTasks.set(taskId, task);
        }

        xhr.send();
    });
}

// ==================== 下载进度条功能 ====================

// 显示下载进度条
function showDownloadProgress() {
    // 移除已有的进度条
    hideDownloadProgress();

    const progressHtml = `
        <div id="downloadProgressOverlay" class="download-progress-overlay">
            <div class="download-progress-modal">
                <div class="progress-header">
                    <span class="progress-title">📥 正在下载...</span>
                    <button class="progress-cancel-btn" onclick="cancelDownload()">✕</button>
                </div>
                <div class="progress-filename" id="progressFilename">准备中...</div>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="progressBar" style="width: 0%"></div>
                </div>
                <div class="progress-info">
                    <span id="progressPercent">0%</span>
                    <span id="progressSize">0MB / 0MB</span>
                    <span id="progressSpeed">-- MB/s</span>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', progressHtml);
}

// 更新下载进度
function updateDownloadProgress(percent, downloadedMB, totalMB, speedMBps) {
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const progressSize = document.getElementById('progressSize');
    const progressSpeed = document.getElementById('progressSpeed');

    if (progressBar) progressBar.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressSize) progressSize.textContent = `${downloadedMB.toFixed(2)}MB / ${totalMB.toFixed(2)}MB`;
    if (progressSpeed) progressSpeed.textContent = `${speedMBps.toFixed(2)} MB/s`;
}

// 隐藏下载进度条
function hideDownloadProgress() {
    const overlay = document.getElementById('downloadProgressOverlay');
    if (overlay) overlay.remove();
}

// 取消下载
let currentXHR = null;
let downloadPollingTimer = null;
let currentTaskId = null;

// 下载任务列表
const downloadTasks = new Map();

// 🔧 队列控制状态
let isQueuePaused = false;  // 队列是否暂停
let downloadQueue = [];     // 等待下载的任务队列

// 暂停下载队列（立即中断所有正在下载的任务）
function pauseDownloadQueue() {
    isQueuePaused = true;

    // 🔧 将所有正在下载的任务标记为暂停状态，这会触发 XHR 进度回调中的 abort
    for (const [id, task] of downloadTasks) {
        if (task.status === 'downloading' || task.status === 'starting') {
            task.status = 'paused';
            task.stage = '⏸️ 已暂停';
            downloadTasks.set(id, task);

            // 直接中断 XHR
            if (task.xhr) {
                task.xhr.abort();
            }
        }
    }

    renderDownloadList();
    showToast('下载队列已暂停', 'warning');
    updateQueueControlButtons();
}

// 恢复下载队列（重新开始暂停的任务）
function resumeDownloadQueue() {
    isQueuePaused = false;
    showToast('下载队列已恢复，请重新点击"全部下载"按钮', 'success');
    updateQueueControlButtons();
}


// 清除已完成的下载任务
function clearCompletedDownloads() {
    const toRemove = [];
    for (const [id, task] of downloadTasks) {
        if (task.status === 'completed' || task.status === 'cancelled' || task.status === 'error') {
            toRemove.push(id);
        }
    }
    toRemove.forEach(id => downloadTasks.delete(id));
    renderDownloadList();
    updateDownloadBadge();
    showToast(`已清除 ${toRemove.length} 个已完成/已取消的任务`, 'success');
}

// 取消所有下载任务
function cancelAllDownloads() {
    // 清空等待队列
    downloadQueue = [];
    isQueuePaused = false;

    // 取消所有进行中的任务
    for (const [id, task] of downloadTasks) {
        if (task.status !== 'completed' && task.status !== 'error' && task.status !== 'cancelled') {
            task.status = 'cancelled';
            task.stage = '已取消';
            downloadTasks.set(id, task);

            // 取消 XHR
            if (task.xhr) {
                task.xhr.abort();
            }
        }
    }

    renderDownloadList();
    updateDownloadBadge();
    updateQueueControlButtons();
    showToast('已取消所有下载任务', 'warning');
}

// 更新队列控制按钮状态
function updateQueueControlButtons() {
    const pauseBtn = document.getElementById('pauseQueueBtn');
    const resumeBtn = document.getElementById('resumeQueueBtn');

    if (pauseBtn && resumeBtn) {
        if (isQueuePaused) {
            pauseBtn.style.display = 'none';
            resumeBtn.style.display = 'flex';
        } else {
            pauseBtn.style.display = 'flex';
            resumeBtn.style.display = 'none';
        }
    }
}

// 处理队列中的下一个任务（由 downloadAllBatch 调用）
function processNextInQueue() {
    // 队列处理在 downloadAllBatch 中实现
    // 这里只是一个钩子函数
}


// 取消下载（调用后端真正取消）
async function cancelDownload(taskId = null) {
    const targetTaskId = taskId || currentTaskId;

    // 取消 XHR 请求
    if (currentXHR) {
        currentXHR.abort();
        currentXHR = null;
    }
    // 停止轮询
    if (downloadPollingTimer) {
        clearInterval(downloadPollingTimer);
        downloadPollingTimer = null;
    }

    // 调用后端取消 API
    if (targetTaskId) {
        try {
            console.log('取消下载任务:', targetTaskId);
            await fetch(`${API_BASE_URL}/api/cancel-download/${targetTaskId}`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            console.error('调用取消 API 失败:', e);
        }

        // 更新本地任务状态
        const task = downloadTasks.get(targetTaskId);
        if (task) {
            task.status = 'cancelled';
            task.stage = '已取消';
            downloadTasks.set(targetTaskId, task);
            renderDownloadList();
        }
    }

    currentTaskId = null;
    hideDownloadProgress();
    showToast('下载已取消', 'warning');
}

// 切换下载侧边栏显示
function toggleDownloadSidebar() {
    const sidebar = document.getElementById('downloadSidebar');
    const overlay = document.getElementById('downloadOverlay');

    if (!sidebar || !overlay) return;

    const isHidden = sidebar.classList.contains('hidden');

    if (isHidden) {
        sidebar.classList.remove('hidden');
        overlay.classList.add('active');
    } else {
        sidebar.classList.add('hidden');
        overlay.classList.remove('active');
    }
}

// 添加下载任务到列表
function addDownloadTask(taskId, filename, url) {
    downloadTasks.set(taskId, {
        id: taskId,
        filename: filename,
        url: url,
        status: 'starting',
        stage: '准备中...',
        percent: 0,
        speed: '-- MB/s',
        createdAt: Date.now()
    });

    renderDownloadList();
    updateDownloadBadge();

    // 自动打开侧边栏
    const sidebar = document.getElementById('downloadSidebar');
    if (sidebar && sidebar.classList.contains('hidden')) {
        toggleDownloadSidebar();
    }
}

// 更新下载任务进度
function updateDownloadTask(taskId, data) {
    const task = downloadTasks.get(taskId);
    if (!task) return;

    task.status = data.status || task.status;
    task.stage = data.stage || task.stage;
    task.percent = data.percent || task.percent;
    task.speed = data.speed || task.speed;
    task.downloadUrl = data.downloadUrl || task.downloadUrl;
    task.fileName = data.fileName || task.fileName;

    downloadTasks.set(taskId, task);
    renderDownloadList();
    updateDownloadBadge();
}

// 从列表移除任务
function removeDownloadTask(taskId) {
    downloadTasks.delete(taskId);
    renderDownloadList();
    updateDownloadBadge();
}

// 更新下载徽章
function updateDownloadBadge() {
    const badge = document.getElementById('downloadBadge');
    if (!badge) return;

    // 计算进行中的任务数
    let activeCount = 0;
    for (const [id, task] of downloadTasks) {
        if (task.status !== 'completed' && task.status !== 'error' && task.status !== 'cancelled') {
            activeCount++;
        }
    }

    if (activeCount > 0) {
        badge.textContent = activeCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// 获取阶段显示名称
function getStageName(stage) {
    const stageNames = {
        'video': '📥 下载视频流',
        'audio': '📥 下载音频流',
        'merge': '🔄 合并音视频',
        'complete': '✅ 已完成',
        'completed': '✅ 已完成',
        'error': '❌ 失败',
        'cancelled': '⏹ 已取消',
        'starting': '⏳ 准备中...'
    };
    return stageNames[stage] || stage;
}

// 渲染下载列表
function renderDownloadList() {
    const listContainer = document.getElementById('downloadList');
    if (!listContainer) return;

    // 如果没有任务，显示空状态
    if (downloadTasks.size === 0) {
        listContainer.innerHTML = `
            <div class="download-empty">
                <i class="fas fa-inbox"></i>
                <p>暂无下载任务</p>
            </div>
        `;
        return;
    }

    // 将任务按创建时间倒序排列
    const sortedTasks = Array.from(downloadTasks.values()).sort((a, b) => b.createdAt - a.createdAt);

    let html = '';
    for (const task of sortedTasks) {
        const statusClass = task.status === 'completed' ? 'completed' :
            task.status === 'error' ? 'error' :
                task.status === 'cancelled' ? 'cancelled' :
                    task.status === 'paused' ? 'paused' : '';

        const showCancel = task.status !== 'completed' && task.status !== 'error' && task.status !== 'cancelled';
        const showRetry = task.status === 'error';
        const showClose = task.status === 'completed' || task.status === 'cancelled';

        html += `
            <div class="download-item ${statusClass}" data-task-id="${task.id}">
                <div class="download-item-header">
                    <div class="download-item-title">${escapeHtml(task.filename)}</div>
                    ${showCancel ? `<button class="download-item-cancel" onclick="cancelDownload('${task.id}')"><i class="fas fa-times"></i></button>` : ''}
                    ${showClose ? `<button class="download-item-cancel" onclick="removeDownloadTask('${task.id}')"><i class="fas fa-times"></i></button>` : ''}
                </div>
                <div class="download-item-progress">
                    <div class="download-item-progress-fill" style="width: ${task.percent}%"></div>
                </div>
                <div class="download-item-info">
                    <span class="download-item-stage">${getStageName(task.stage)}</span>
                    <span class="download-item-percent">${task.percent}%</span>
                </div>
            </div>
        `;
    }

    listContainer.innerHTML = html;
}

// HTML 转义
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 带进度条的下载（使用 XMLHttpRequest，更可靠）
function downloadWithProgress(url, filename) {
    console.log('📥 downloadWithProgress 开始:', filename);
    console.log('📥 URL:', url);
    showDownloadProgress();
    console.log('📥 进度条已显示');

    // 更新文件名显示
    const progressFilename = document.getElementById('progressFilename');
    if (progressFilename) progressFilename.textContent = filename;

    const startTime = Date.now();
    let lastUpdate = Date.now();
    let lastBytes = 0;

    currentXHR = new XMLHttpRequest();
    currentXHR.open('GET', url, true);
    currentXHR.responseType = 'blob';
    currentXHR.withCredentials = true;

    // 进度事件
    currentXHR.onprogress = function (event) {
        const now = Date.now();
        if (now - lastUpdate >= 200) {  // 每 200ms 更新一次
            const downloadedBytes = event.loaded;
            const totalBytes = event.total || event.loaded;
            const downloadedMB = downloadedBytes / (1024 * 1024);
            const totalMB = totalBytes / (1024 * 1024);
            const percent = event.lengthComputable ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
            const speedMBps = ((downloadedBytes - lastBytes) / ((now - lastUpdate) / 1000)) / (1024 * 1024);

            updateDownloadProgress(percent, downloadedMB, totalMB, speedMBps);

            lastUpdate = now;
            lastBytes = downloadedBytes;
        }
    };

    // 完成事件
    currentXHR.onload = function () {
        if (currentXHR.status === 200) {
            const blob = currentXHR.response;
            const blobUrl = URL.createObjectURL(blob);

            // 触发保存
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);

            hideDownloadProgress();

            const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
            const finalSize = (blob.size / (1024 * 1024)).toFixed(2);
            showToast(`✅ 下载完成: ${finalSize}MB (${totalTime}s)`, 'success');
        } else {
            hideDownloadProgress();
            showToast('下载失败: HTTP ' + currentXHR.status, 'error');
        }
    };

    // 错误事件
    currentXHR.onerror = function () {
        hideDownloadProgress();
        showToast('下载失败: 网络错误', 'error');
    };

    // 取消事件
    currentXHR.onabort = function () {
        hideDownloadProgress();
        console.log('下载已取消');
    };

    currentXHR.send();
}

// 使用异步任务下载（带进度轮询 + 侧边栏列表）
async function downloadWithAsyncTask(url, qn, nameFormat, filename) {
    console.log('📥 开始异步下载任务:', { url, qn, nameFormat, filename });

    try {
        // 1. 创建下载任务
        const response = await fetch(`${API_BASE_URL}/api/bilibili/download-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ url, qn, nameFormat, format: 'mp4' })
        });

        if (!response.ok) {
            throw new Error('创建下载任务失败');
        }

        const result = await response.json();
        if (!result.success || !result.taskId) {
            throw new Error(result.error || '创建下载任务失败');
        }

        currentTaskId = result.taskId;
        console.log('📋 下载任务已创建:', currentTaskId);

        // 添加到下载列表
        addDownloadTask(currentTaskId, filename, url);

        // 2. 开始轮询进度
        return new Promise((resolve, reject) => {
            downloadPollingTimer = setInterval(async () => {
                try {
                    const progressRes = await fetch(`${API_BASE_URL}/api/download-progress/${currentTaskId}`);
                    const progressData = await progressRes.json();

                    if (!progressData.success) {
                        return;
                    }

                    const data = progressData.data;

                    // 更新下载列表中的任务
                    updateDownloadTask(currentTaskId, {
                        status: data.status,
                        stage: data.stage,
                        percent: data.percent || 0,
                        speed: data.speed || '-- MB/s',
                        downloadUrl: data.downloadUrl,
                        fileName: data.fileName
                    });

                    // 检查完成状态
                    if (data.status === 'completed') {
                        clearInterval(downloadPollingTimer);
                        downloadPollingTimer = null;

                        // 获取下载URL（优先从 data 获取，备选从任务对象获取）
                        const downloadUrl = data.downloadUrl || downloadTasks.get(currentTaskId)?.downloadUrl;
                        const fileName = data.fileName || downloadTasks.get(currentTaskId)?.fileName || filename;

                        console.log('✅ 下载完成，downloadUrl:', downloadUrl, 'fileName:', fileName);

                        // 触发浏览器下载
                        if (downloadUrl) {
                            showToast('✅ 视频处理完成，开始下载文件', 'success');
                            triggerBrowserDownload(downloadUrl, fileName);
                        } else {
                            console.error('❌ 没有找到下载 URL，data:', data);
                            showToast('❌ 下载失败：无法获取文件链接', 'error');
                        }

                        resolve(data);
                    } else if (data.status === 'error') {
                        clearInterval(downloadPollingTimer);
                        downloadPollingTimer = null;
                        reject(new Error(data.error || '下载失败'));
                    } else if (data.status === 'cancelled') {
                        clearInterval(downloadPollingTimer);
                        downloadPollingTimer = null;
                        reject(new Error('下载已取消'));
                    }

                } catch (pollError) {
                    console.error('轮询进度失败:', pollError);
                }
            }, 500); // 每 500ms 轮询一次

            // 设置超时（10分钟）
            setTimeout(() => {
                if (downloadPollingTimer) {
                    clearInterval(downloadPollingTimer);
                    downloadPollingTimer = null;
                    updateDownloadTask(currentTaskId, { status: 'error', stage: '超时' });
                    reject(new Error('下载超时'));
                }
            }, 10 * 60 * 1000);
        });

    } catch (error) {
        if (currentTaskId) {
            updateDownloadTask(currentTaskId, { status: 'error', stage: error.message });
        }
        throw error;
    }
}

// ==================== 设置功能 ====================

function toggleSettings() {
    const sidebar = document.getElementById('settingsSidebar');
    const overlay = document.getElementById('settingsOverlay');

    if (!sidebar || !overlay) return;

    // 新 HTML 使用 .active 类控制显示
    if (sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay.classList.add('hidden');
    } else {
        sidebar.classList.add('active');
        overlay.classList.remove('hidden');
    }
}

function loadSettings() {
    try {
        const saved = localStorage.getItem('appSettings');
        if (saved) {
            appSettings = { ...appSettings, ...JSON.parse(saved) };
        }

        // 应用到UI
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.theme === appSettings.theme) {
                btn.classList.add('active');
            }
        });

        const filenameSelect = document.getElementById('filenameFormat');
        if (filenameSelect) filenameSelect.value = appSettings.filenameFormat;

        const autoDownload = document.getElementById('autoDownload');
        if (autoDownload) autoDownload.checked = appSettings.autoDownload;

        const showQualityTip = document.getElementById('showQualityTip');
        if (showQualityTip) showQualityTip.checked = appSettings.showQualityTip;

        const rememberQuality = document.getElementById('rememberQuality');
        if (rememberQuality) rememberQuality.checked = appSettings.rememberQuality;

    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

function saveSettings() {
    try {
        const filenameSelect = document.getElementById('filenameFormat');
        const autoDownload = document.getElementById('autoDownload');
        const showQualityTip = document.getElementById('showQualityTip');
        const rememberQuality = document.getElementById('rememberQuality');

        if (filenameSelect) appSettings.filenameFormat = filenameSelect.value;
        if (autoDownload) appSettings.autoDownload = autoDownload.checked;
        if (showQualityTip) appSettings.showQualityTip = showQualityTip.checked;
        if (rememberQuality) appSettings.rememberQuality = rememberQuality.checked;

        localStorage.setItem('appSettings', JSON.stringify(appSettings));
    } catch (error) {
        console.error('保存设置失败:', error);
    }
}

function setTheme(theme) {
    appSettings.theme = theme;

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });

    applyTheme();
    saveSettings();
}

function applyTheme() {
    let isDark = true;

    // 优先使用 appState（新 HTML），否则使用 appSettings（旧 HTML）
    const theme = appState ? appState.theme : (appSettings ? appSettings.theme : 'light');

    if (theme === 'light') {
        isDark = false;
    } else if (theme === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (isDark) {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }
}

// ==================== 智能识别输入 ====================

// 更新输入提示
function updateInputHint() {
    const input = videoUrlInput ? videoUrlInput.value.trim() : '';
    const hintEl = document.getElementById('inputHint');
    const linkCountEl = document.getElementById('linkCount');
    const linkNumEl = document.getElementById('linkNum');

    // 新HTML可能没有这些元素，静默返回
    if (!hintEl) return;

    if (!input) {
        hintEl.innerHTML = '<i class="fas fa-info-circle"></i> <span>粘贴视频链接、收藏夹ID或多个链接自动识别</span>';
        if (linkCountEl) linkCountEl.classList.add('hidden');
        return;
    }

    const inputType = detectInputType(input);

    switch (inputType.type) {
        case 'favorites':
            hintEl.innerHTML = `<i class="fas fa-star" style="color: #fbbf24;"></i> <span>检测到收藏夹：${inputType.id}</span>`;
            if (linkCountEl) linkCountEl.classList.add('hidden');
            break;
        case 'user':
            hintEl.innerHTML = `<i class="fas fa-user" style="color: #10b981;"></i> <span>检测到UP主主页：UID ${inputType.uid}</span>`;
            if (linkCountEl) linkCountEl.classList.add('hidden');
            break;
        case 'multi':
            hintEl.innerHTML = `<i class="fas fa-list" style="color: var(--primary-color);"></i> <span>检测到多个链接，将批量处理</span>`;
            if (linkCountEl) linkCountEl.classList.remove('hidden');
            if (linkNumEl) linkNumEl.textContent = inputType.urls.length;
            break;
        case 'single':
            hintEl.innerHTML = `<i class="fas fa-video" style="color: var(--bilibili-pink);"></i> <span>检测到视频链接</span>`;
            if (linkCountEl) linkCountEl.classList.add('hidden');
            break;
        default:
            hintEl.innerHTML = `<i class="fas fa-question-circle" style="color: var(--warning-color);"></i> <span>请输入视频链接、收藏夹或用户主页</span>`;
            if (linkCountEl) linkCountEl.classList.add('hidden');
    }
}

// 检测输入类型（支持混合输入，支持链接粘连）
function detectInputType(input) {
    // 存储提取结果
    const favorites = [];  // 收藏夹 ID 列表
    const users = [];      // UP主 UID 列表
    const videoUrls = [];  // 视频链接列表

    // 🔧 先分离粘连的链接（在 https:// 或 http:// 前面加换行）
    const separatedInput = input.replace(/(https?:\/\/)/gi, '\n$1');

    // 按行分割并清理
    const lines = separatedInput.split(/[\n\r]+/).map(l => l.trim()).filter(l => l);

    for (const line of lines) {
        // 检查收藏夹 (favlist?fid= 或 ml+数字)
        const favlistMatch = line.match(/favlist.*fid=(\d+)/);
        const mlMatch = line.match(/\/ml(\d+)/i);
        const fidOnlyMatch = line.match(/\bfid=(\d+)/);

        if (favlistMatch || mlMatch) {
            const id = favlistMatch?.[1] || mlMatch?.[1];
            if (id && !favorites.includes(id)) favorites.push(id);
            continue; // 收藏夹链接不再作为视频链接提取
        }

        // 检查UP主主页（必须是 space.bilibili.com/数字 且后面不是 favlist）
        const spaceMatch = line.match(/space\.bilibili\.com\/(\d+)(?!.*favlist)/);
        if (spaceMatch && !line.includes('favlist')) {
            if (!users.includes(spaceMatch[1])) users.push(spaceMatch[1]);
            continue; // UP主链接不再作为视频链接提取
        }

        // 检查是视频链接（BV号或AV号）
        const bvMatch = line.match(/BV[a-zA-Z0-9]{10}/i);
        const avMatch = line.match(/av(\d+)/i);

        if (bvMatch || avMatch) {
            // 构造标准化链接
            let videoUrl = line;
            if (bvMatch) {
                videoUrl = `https://www.bilibili.com/video/${bvMatch[0]}`;
            } else if (avMatch) {
                videoUrl = `https://www.bilibili.com/video/av${avMatch[1]}`;
            }
            if (!videoUrls.includes(videoUrl)) videoUrls.push(videoUrl);
        }
    }

    // 判断类型
    const hasMultipleTypes = (favorites.length > 0 && videoUrls.length > 0) ||
        (users.length > 0 && videoUrls.length > 0) ||
        (favorites.length > 0 && users.length > 0) ||
        favorites.length > 1 || users.length > 1;

    if (hasMultipleTypes) {
        // 混合类型：收藏夹+视频、UP主+视频等
        return {
            type: 'mixed',
            favorites,
            users,
            videoUrls,
            summary: `${favorites.length}个收藏夹, ${users.length}个UP主, ${videoUrls.length}个视频链接`
        };
    }

    // 单一类型
    if (favorites.length === 1) {
        return { type: 'favorites', id: favorites[0] };
    }

    if (users.length === 1) {
        return { type: 'user', uid: users[0] };
    }

    if (videoUrls.length > 1) {
        return { type: 'multi', urls: videoUrls };
    }

    if (videoUrls.length === 1) {
        return { type: 'single', url: videoUrls[0] };
    }

    // 检查是否是纯数字（可能是收藏夹ID）
    if (/^\d+$/.test(input.trim()) && input.trim().length > 5) {
        return { type: 'favorites', id: input.trim() };
    }

    return { type: 'unknown' };
}


// 提取视频链接 - 支持换行、空格、逗号等分隔，以及连在一起的多个链接

function extractBilibiliUrls(text) {
    const urls = new Set();

    // 🔧 预处理：在每个 https:// 或 http:// 前添加空格，解决链接连在一起的问题
    // 例如: "...clickhttps://..." → "...click https://..."
    let processedText = text.replace(/(https?:\/\/)/gi, ' $1');

    // 提取所有 BV 号（BV + 10位字符）⚠️ 保持原始大小写！BV号是大小写敏感的！
    const bvMatches = processedText.matchAll(/BV[a-zA-Z0-9]{10}/g); // 不用 gi，保持大小写
    for (const match of bvMatches) {
        const bv = match[0]; // 保持原始大小写
        urls.add(`https://www.bilibili.com/video/${bv}`);
    }

    // 提取 av 号
    const avMatches = processedText.matchAll(/av(\d+)/gi);
    for (const match of avMatches) {
        urls.add(`https://www.bilibili.com/video/av${match[1]}`);
    }

    // 提取 b23.tv 短链接的 ID
    const shortUrlMatches = processedText.matchAll(/b23\.tv\/([a-zA-Z0-9]+)/gi);
    for (const match of shortUrlMatches) {
        urls.add(`https://b23.tv/${match[1]}`);
    }

    console.log('提取到的链接:', Array.from(urls)); // 调试日志

    return Array.from(urls);
}

// 智能处理入口
async function handleSmartParse() {
    const input = videoUrlInput.value.trim();

    if (!input) {
        showToast('请输入视频链接或收藏夹ID', 'error');
        videoUrlInput.focus();
        return;
    }

    const inputType = detectInputType(input);

    switch (inputType.type) {
        case 'favorites':
            await handleFavoritesParse(inputType.id);
            break;
        case 'user':
            await handleUserVideosParse(inputType.uid);
            break;
        case 'multi':
            await handleMultiParse(inputType.urls);
            break;
        case 'single':
            await handleSingleParse(inputType.url);
            break;
        default:
            // 尝试作为单链接处理
            const urls = extractBilibiliUrls(input);
            if (urls.length > 0) {
                if (urls.length === 1) {
                    await handleSingleParse(urls[0]);
                } else {
                    await handleMultiParse(urls);
                }
            } else {
                showToast('无法识别输入内容，请检查是否为视频链接', 'error');
            }
    }
}

// 单链接解析
async function handleSingleParse(url) {
    // 显示加载状态
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    const loadingTextEl = document.getElementById('loadingText');
    if (loadingTextEl) loadingTextEl.textContent = '正在处理中，请稍候...';
    document.getElementById('loadingProgress')?.classList.add('hidden');
    if (parseBtn) parseBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.success) {
            currentVideoData = data.data;
            displayResult(data.data);
        } else {
            throw new Error(data.error || '处理失败');
        }
    } catch (error) {
        showError(error.message);
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
        if (parseBtn) parseBtn.disabled = false;
    }
}

// ==================== 批量处理 ====================

async function handleMultiParse(urls) {
    if (!urls || urls.length === 0) {
        showToast('请输入至少一个有效链接', 'error');
        return;
    }

    if (urls.length > 50) {
        showToast('单次最多处理50个链接', 'error');
        return;
    }

    // 显示加载状态
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');

    const loadingTextEl = document.getElementById('loadingText');
    if (loadingTextEl) loadingTextEl.textContent = '正在批量处理中...';
    const progressEl = document.getElementById('loadingProgress');
    if (progressEl) progressEl.classList.remove('hidden');

    if (parseBtn) parseBtn.disabled = true;

    batchResults = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < urls.length; i++) {
        // 更新进度
        const progress = ((i + 1) / urls.length) * 100;
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${i + 1}/${urls.length}`;

        try {
            const response = await fetch(`${API_BASE_URL}/api/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urls[i] })
            });

            const data = await response.json();

            if (data.success) {
                batchResults.push({
                    success: true,
                    url: urls[i],
                    data: data.data
                });
                successCount++;
            } else {
                batchResults.push({
                    success: false,
                    url: urls[i],
                    error: data.error || '处理失败'
                });
                failedCount++;
            }
        } catch (error) {
            batchResults.push({
                success: false,
                url: urls[i],
                error: error.message || '网络错误'
            });
            failedCount++;
        }

        // 稍微延迟避免请求过快
        if (i < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // 隐藏加载
    loadingSection.classList.add('hidden');
    if (progressEl) progressEl.classList.add('hidden');
    parseBtn.disabled = false;

    // 显示批量结果
    displayBatchResults(successCount, failedCount);
}

// 显示批量处理结果（适配新 HTML）
function displayBatchResults(successCount, failedCount) {
    // 尝试新 HTML 的元素 ID，如果不存在则使用旧的
    const batchSectionEl = document.getElementById('batchSection');
    const batchListEl = document.getElementById('batchList') || document.getElementById('batchResultList');
    const batchCountEl = document.getElementById('batchCount');

    if (batchCountEl) batchCountEl.textContent = batchResults.length;

    // 隐藏单视频结果区域
    if (resultSection) resultSection.classList.add('hidden');

    if (!batchListEl) return;

    batchListEl.innerHTML = '';

    batchResults.forEach((result, index) => {
        const item = document.createElement('div');
        item.className = 'batch-item';
        item.dataset.index = index;

        if (result.success) {
            const data = result.data;
            let thumbnailUrl = data.thumbnail || '';
            if (thumbnailUrl.startsWith('//')) {
                thumbnailUrl = 'https:' + thumbnailUrl;
            }
            if (thumbnailUrl && (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com'))) {
                thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
            }

            item.innerHTML = `
                <img class="batch-thumb" src="${thumbnailUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 9\"><rect fill=\"%23334155\" width=\"16\" height=\"9\"/></svg>'}">
                <div class="batch-info">
                    <div class="batch-title">${escapeHtml(data.title || '未知标题')}</div>
                    <div class="batch-status success"><i class="fas fa-check"></i> 处理成功</div>
                </div>
                <button onclick="downloadBatchItem(${index})" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                    <i class="fas fa-download"></i>
                </button>
            `;
        } else {
            item.innerHTML = `
                <div class="batch-info">
                    <div class="batch-title">${escapeHtml(result.url)}</div>
                    <div class="batch-status error"><i class="fas fa-times"></i> ${escapeHtml(result.error)}</div>
                </div>
                <button onclick="retryBatchItem(${index})" style="background:var(--blue); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                    <i class="fas fa-redo"></i>
                </button>
            `;
        }

        batchListEl.appendChild(item);
    });

    if (batchSectionEl) {
        batchSectionEl.classList.remove('hidden');
        batchSectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 如果设置了自动下载
    if (appSettings && appSettings.autoDownload && successCount > 0) {
        setTimeout(() => downloadAllBatch(), 500);
    }
}

// 下载批量处理的单个项目
async function downloadBatchItem(index) {
    const result = batchResults[index];
    if (!result || !result.success) return;

    const data = result.data;
    const safeTitle = formatFilename ? formatFilename(data, result.url) : (data.title || 'video').replace(/[<>:"/\\|?*]/g, '_');
    const encodedUrl = encodeURIComponent(result.url);

    // 使用 appState（新 HTML）或 presetFormat/presetQuality（旧 HTML）
    const format = appState ? appState.format : presetFormat;
    const quality = appState ? appState.quality : presetQuality;

    // 更新状态为下载中
    const listItem = document.querySelector(`.batch-item[data-index="${index}"]`) || document.querySelector(`.batch-result-item[data-index="${index}"]`);
    if (listItem) {
        listItem.classList.add('downloading');
    }

    const videoFormat = appState.videoFormat || 'mp4';
    const audioFormat = appState.audioFormat || 'mp3';

    // 生成任务 ID
    const taskId = `batch_${index}_${Date.now()}`;

    try {
        let downloadUrl, filename;

        if (format === 'audio') {
            downloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=audio`;
            filename = `${safeTitle}.${audioFormat}`;
        } else if (format === 'cover') {
            downloadUrl = `${API_BASE_URL}/api/bilibili/download/cover?url=${encodedUrl}`;
            filename = `${safeTitle}.jpg`;
        } else if (format === 'video-only') {
            downloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=video`;
            filename = `${safeTitle}_video.${videoFormat}`;
        } else if (format === 'video+audio-separate') {
            // 分离下载：先视频后音频
            const videoTaskId = `${taskId}_video`;
            const audioTaskId = `${taskId}_audio`;

            const videoUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=video`;
            const videoFilename = `${safeTitle}_video.${videoFormat}`;
            addDownloadTask(videoTaskId, videoFilename, videoUrl);
            await downloadWithTaskProgress(videoUrl, videoFilename, videoTaskId);

            const audioUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=audio`;
            const audioFilename = `${safeTitle}_audio.${audioFormat}`;
            addDownloadTask(audioTaskId, audioFilename, audioUrl);
            await downloadWithTaskProgress(audioUrl, audioFilename, audioTaskId);

            if (listItem) {
                listItem.classList.remove('downloading');
                listItem.classList.add('downloaded');
            }
            showToast('下载完成！', 'success');
            return;
        } else {
            // 视音合体：使用后端异步任务（显示视频下载→音频下载→合并的完整进度）
            filename = `${safeTitle}.${videoFormat}`;
            await downloadWithBackendTask(result.url, filename, quality, videoFormat, 'merge');

            if (listItem) {
                listItem.classList.remove('downloading');
                listItem.classList.add('downloaded');
            }
            showToast('下载完成！', 'success');
            return;
        }

        // 以下仅用于流式下载（audio/cover/video-only）
        // 添加任务到下载列表
        addDownloadTask(taskId, filename, downloadUrl);

        // 使用带进度追踪的下载
        await downloadWithTaskProgress(downloadUrl, filename, taskId);

        if (listItem) {
            listItem.classList.remove('downloading');
            listItem.classList.add('downloaded');
        }

        showToast('下载完成！', 'success');
    } catch (error) {
        console.error('下载失败:', error);
        if (listItem) {
            listItem.classList.remove('downloading');
            listItem.classList.add('download-failed');
        }
    }
}

// 重试失败的项目
async function retryBatchItem(index) {
    const result = batchResults[index];
    if (!result) return;

    showToast('正在重新处理...', 'success');

    const batchListEl = document.getElementById('batchList');
    if (batchListEl && batchListEl.children[index]) {
        batchListEl.children[index].innerHTML = `
            <div class="batch-info">
                <div class="batch-title">正在重新处理...</div>
            </div>
        `;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: result.url })
        });

        const data = await response.json();

        if (data.success) {
            batchResults[index] = {
                success: true,
                url: result.url,
                data: data.data
            };
            showToast('处理成功！', 'success');

            // 更新列表项
            if (batchListEl && batchListEl.children[index]) {
                const resultData = data.data;
                let thumbnailUrl = resultData.thumbnail || '';
                if (thumbnailUrl.startsWith('//')) thumbnailUrl = 'https:' + thumbnailUrl;
                if (thumbnailUrl && (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com'))) {
                    thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
                }

                batchListEl.children[index].innerHTML = `
                    <img class="batch-thumb" src="${thumbnailUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 9\"><rect fill=\"%23334155\" width=\"16\" height=\"9\"/></svg>'}">
                    <div class="batch-info">
                        <div class="batch-title">${escapeHtml(resultData.title || '未知标题')}</div>
                        <div class="batch-status success"><i class="fas fa-check"></i> 处理成功</div>
                    </div>
                    <button onclick="downloadBatchItem(${index})" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                        <i class="fas fa-download"></i>
                    </button>
                `;
            }
        } else {
            batchResults[index] = {
                success: false,
                url: result.url,
                error: data.error || '处理失败'
            };
            showToast('处理仍然失败', 'error');

            // 更新列表项显示错误
            if (batchListEl && batchListEl.children[index]) {
                batchListEl.children[index].innerHTML = `
                    <div class="batch-info">
                        <div class="batch-title">${escapeHtml(result.url)}</div>
                        <div class="batch-status error"><i class="fas fa-times"></i> ${escapeHtml(data.error || '处理失败')}</div>
                    </div>
                    <button onclick="retryBatchItem(${index})" style="background:var(--blue); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                        <i class="fas fa-redo"></i>
                    </button>
                `;
            }
        }

        // 更新计数
        const batchCountEl = document.getElementById('batchCount');
        if (batchCountEl) {
            const successCount = batchResults.filter(r => r.success).length;
            batchCountEl.textContent = batchResults.length;
        }

    } catch (error) {
        showToast('重试失败: ' + error.message, 'error');

        // 更新列表项显示错误
        const batchListEl = document.getElementById('batchList');
        if (batchListEl && batchListEl.children[index]) {
            batchListEl.children[index].innerHTML = `
                <div class="batch-info">
                    <div class="batch-title">${escapeHtml(result.url)}</div>
                    <div class="batch-status error"><i class="fas fa-times"></i> ${escapeHtml(error.message || '网络错误')}</div>
                </div>
                <button onclick="retryBatchItem(${index})" style="background:var(--blue); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                    <i class="fas fa-redo"></i>
                </button>
            `;
        }
    }
}

// 全部下载
async function downloadAllBatch() {
    // 获取成功项及其原始索引
    const successItems = [];
    batchResults.forEach((r, idx) => {
        if (r.success) {
            successItems.push({ ...r, originalIndex: idx });
        }
    });

    if (successItems.length === 0) {
        showToast('没有可下载的项目', 'error');
        return;
    }

    // 显示下载进度（兼容不同HTML结构）
    const progressSection = document.getElementById('downloadProgressSection') || document.getElementById('progressSection');
    const progressFill = document.getElementById('downloadProgressFill') || document.getElementById('progressFill');
    const progressText = document.getElementById('downloadProgressText') || document.getElementById('progressNum');
    const currentInfo = document.getElementById('currentDownloadInfo') || document.getElementById('progressStatus');
    const downloadBtn = document.getElementById('downloadAllBtn');

    if (progressSection) progressSection.classList.remove('hidden');
    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 下载中...';
    }

    // 获取当前预设（统一使用 appState）
    const format = appState ? appState.format : presetFormat;
    const quality = appState ? appState.quality : presetQuality;

    // 逐个下载
    for (let i = 0; i < successItems.length; i++) {
        // 🔧 检查队列是否暂停
        if (isQueuePaused) {
            if (currentInfo) currentInfo.textContent = '⏸️ 队列已暂停，点击恢复继续下载';
            // 等待恢复
            await new Promise(resolve => {
                const checkResume = setInterval(() => {
                    if (!isQueuePaused) {
                        clearInterval(checkResume);
                        resolve();
                    }
                }, 500);
            });
            if (currentInfo) currentInfo.textContent = '继续下载...';
        }

        const item = successItems[i];
        const data = item.data;
        const encodedUrl = encodeURIComponent(item.url);

        // 更新进度
        const progress = ((i + 1) / successItems.length) * 100;
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `${i + 1}/${successItems.length}`;
        if (currentInfo) currentInfo.textContent = `正在下载: ${data.title || '未知视频'}`;

        // 更新列表项状态（使用原始索引）
        const listItem = document.querySelector(`.batch-result-item[data-index="${item.originalIndex}"]`) ||
            document.querySelector(`.batch-item[data-index="${item.originalIndex}"]`);
        if (listItem) {
            listItem.classList.remove('downloaded', 'download-failed');
            listItem.classList.add('downloading');
        }

        try {
            const safeTitle = formatFilename ? formatFilename(data, item.url) : (data.title || 'video').replace(/[<>:"/\\|?*]/g, '_');


            // 根据预设格式下载（使用统一的 format、quality、videoFormat、audioFormat）
            const videoFormat = appState.videoFormat || 'mp4';
            const audioFormat = appState.audioFormat || 'mp3';

            // 生成任务 ID
            const taskId = `batch_all_${i}_${Date.now()}`;
            let downloadUrl, filename;

            if (format === 'audio') {
                downloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=audio`;
                filename = `${safeTitle}.${audioFormat}`;
                addDownloadTask(taskId, filename, downloadUrl);
                await downloadWithTaskProgress(downloadUrl, filename, taskId);
            } else if (format === 'cover') {
                downloadUrl = `${API_BASE_URL}/api/bilibili/download/cover?url=${encodedUrl}`;
                filename = `${safeTitle}.jpg`;
                addDownloadTask(taskId, filename, downloadUrl);
                await downloadWithTaskProgress(downloadUrl, filename, taskId);
            } else if (format === 'video-only') {
                downloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=video`;
                filename = `${safeTitle}_video.${videoFormat}`;
                addDownloadTask(taskId, filename, downloadUrl);
                await downloadWithTaskProgress(downloadUrl, filename, taskId);
            } else if (format === 'video+audio-separate') {
                // 分离下载
                const videoTaskId = `${taskId}_video`;
                const audioTaskId = `${taskId}_audio`;

                const videoUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=video`;
                const videoFilename = `${safeTitle}_video.${videoFormat}`;
                addDownloadTask(videoTaskId, videoFilename, videoUrl);
                await downloadWithTaskProgress(videoUrl, videoFilename, videoTaskId);

                const audioUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${quality}&type=audio`;
                const audioFilename = `${safeTitle}_audio.${audioFormat}`;
                addDownloadTask(audioTaskId, audioFilename, audioUrl);
                await downloadWithTaskProgress(audioUrl, audioFilename, audioTaskId);
            } else {
                // 视音合体：使用后端异步任务（显示视频下载→音频下载→合并的完整进度）
                filename = `${safeTitle}.${videoFormat}`;
                await downloadWithBackendTask(item.url, filename, quality, videoFormat, 'merge');
            }



            if (listItem) {
                listItem.classList.remove('downloading');
                listItem.classList.add('downloaded');
            }

        } catch (error) {
            console.error('下载失败:', error);
            if (listItem) {
                listItem.classList.remove('downloading');
                listItem.classList.add('download-failed');
            }
        }

        // 间隔下载（给浏览器和服务器时间处理）
        if (i < successItems.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // 完成
    if (currentInfo) currentInfo.textContent = '下载任务已全部发起！';
    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> 全部下载';
    }

    setTimeout(() => {
        if (progressSection) progressSection.classList.add('hidden');
    }, 3000);

    showToast(`已发起 ${successItems.length} 个视频的下载`, 'success');
}

// 获取下载类型和扩展名
function getDownloadTypeAndExt() {
    let downloadType = 'video';
    let fileExt = 'mp4';

    if (presetFormat === 'audio') {
        downloadType = 'audio';
        fileExt = 'm4a';
    } else if (presetFormat === 'cover') {
        downloadType = 'cover';
        fileExt = 'jpg';
    } else if (presetFormat === 'video-only') {
        downloadType = 'video-only';
        fileExt = 'm4s';
    } else if (presetFormat === 'video+audio-separate') {
        downloadType = 'separate';
        fileExt = 'm4s'; // 视频部分
    } else {
        // video+audio 合并，需要 ffmpeg
        downloadType = 'merged';
        fileExt = 'mp4';
    }

    return { downloadType, fileExt };
}

// 构建下载URL - 使用流式代理
function buildDownloadUrl(videoUrl, downloadType) {
    const encodedUrl = encodeURIComponent(videoUrl);

    switch (downloadType) {
        case 'audio':
            return `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${presetQuality}&type=audio`;
        case 'cover':
            return `${API_BASE_URL}/api/bilibili/download/cover?url=${encodedUrl}`;
        case 'video-only':
            return `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${presetQuality}&type=video`;
        case 'merged':
            // 需要服务器合并
            return `${API_BASE_URL}/api/bilibili/download?url=${encodedUrl}&qn=${presetQuality}`;
        default:
            return `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${presetQuality}&type=video`;
    }
}

// 格式化文件名
function formatFilename(data, url) {
    let filename = (data.title || 'video').replace(/[<>:"/\\|?*]/g, '_').substring(0, 80);

    switch (appSettings.filenameFormat) {
        case 'bvid-title':
            const bvMatch = url.match(/BV[a-zA-Z0-9]+/i);
            if (bvMatch) {
                filename = `${bvMatch[0]}-${filename}`;
            }
            break;
        case 'author-title':
            if (data.author) {
                filename = `${data.author.replace(/[<>:"/\\|?*]/g, '_')}-${filename}`;
            }
            break;
        case 'title-date':
            const date = new Date().toISOString().split('T')[0];
            filename = `${filename}-${date}`;
            break;
    }

    return filename;
}

// 清空批量结果
function clearBatchResults() {
    batchResults = [];
    document.getElementById('multiVideoUrls').value = '';
    updateLinkCount();
    showToast('已清空', 'success');
}

// ==================== 收藏夹处理 ====================

async function handleFavoritesParse(favId) {
    if (!favId) {
        showToast('无法识别收藏夹ID', 'error');
        return;
    }

    // 显示加载状态（添加 null 检查）
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    document.getElementById('batchSection')?.classList.add('hidden');

    const loadingTextEl = document.getElementById('loadingText');
    if (loadingTextEl) loadingTextEl.textContent = '正在处理收藏夹...';
    const progressEl = document.getElementById('loadingProgress');
    if (progressEl) progressEl.classList.add('hidden');

    if (parseBtn) parseBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/bilibili/favorites?id=${favId}`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && data.videos) {
            // 转换为批量结果格式
            batchResults = data.videos.map(video => ({
                success: true,
                url: video.url,
                data: {
                    title: video.title,
                    author: video.author,
                    thumbnail: video.thumbnail,
                    duration: video.duration,
                    platform: '视频',
                    bvid: video.bvid
                }
            }));

            // 显示批量结果（适配新 HTML）
            const batchSectionEl = document.getElementById('batchSection');
            const batchListEl = document.getElementById('batchList');
            const batchCountEl = document.getElementById('batchCount');

            if (batchSectionEl) batchSectionEl.classList.remove('hidden');
            if (resultSection) resultSection.classList.add('hidden');
            if (batchListEl) {
                batchListEl.innerHTML = '';
                batchResults.forEach((result, index) => {
                    const item = document.createElement('div');
                    item.className = 'batch-item';
                    item.dataset.index = index;
                    const data = result.data;
                    let thumbnailUrl = data.thumbnail || '';
                    if (thumbnailUrl.startsWith('//')) thumbnailUrl = 'https:' + thumbnailUrl;
                    if (thumbnailUrl && (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com'))) {
                        thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
                    }
                    item.innerHTML = `
                        <img class="batch-thumb" src="${thumbnailUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 9\"><rect fill=\"%23334155\" width=\"16\" height=\"9\"/></svg>'}">
                        <div class="batch-info">
                            <div class="batch-title">${escapeHtml(data.title || '未知标题')}</div>
                            <div class="batch-status success"><i class="fas fa-check"></i> 处理成功</div>
                        </div>
                        <button onclick="downloadBatchItem(${index})" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-download"></i>
                        </button>
                    `;
                    batchListEl.appendChild(item);
                });
            }
            if (batchCountEl) batchCountEl.textContent = batchResults.length;

            showToast(`成功处理 ${data.videos.length} 个视频`, 'success');
        } else {
            throw new Error(data.error || '处理收藏夹失败');
        }

    } catch (error) {
        showError(error.message);
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
        if (parseBtn) parseBtn.disabled = false;
    }
}

// ==================== 混合类型处理（收藏夹+视频链接等） ====================

async function handleMixedParse(inputType) {
    const { favorites, users, videoUrls, summary } = inputType;

    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    document.getElementById('batchSection')?.classList.add('hidden');

    const loadingTextEl = document.getElementById('loadingText');
    if (loadingTextEl) loadingTextEl.textContent = `检测到混合输入 (${summary})，正在处理...`;
    if (parseBtn) parseBtn.disabled = true;

    // 收集所有视频链接
    let allVideoUrls = [...videoUrls]; // 先加入直接的视频链接

    try {
        // 1. 处理所有收藏夹
        for (let i = 0; i < favorites.length; i++) {
            const favId = favorites[i];
            if (loadingTextEl) loadingTextEl.textContent = `正在处理收藏夹 ${i + 1}/${favorites.length} (ID: ${favId})...`;

            try {
                const response = await fetch(`${API_BASE_URL}/api/bilibili/favorites?id=${favId}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.success && data.videos) {
                    const favUrls = data.videos.map(v => v.url);
                    console.log(`收藏夹 ${favId} 获取到 ${favUrls.length} 个视频`);
                    allVideoUrls = [...allVideoUrls, ...favUrls];
                }
            } catch (e) {
                console.error(`收藏夹 ${favId} 处理失败:`, e);
            }

            // 稍微延迟避免请求过快
            await new Promise(r => setTimeout(r, 200));
        }

        // 2. 处理所有 UP 主
        for (let i = 0; i < users.length; i++) {
            const uid = users[i];
            if (loadingTextEl) loadingTextEl.textContent = `正在处理UP主 ${i + 1}/${users.length} (UID: ${uid})...`;

            try {
                const response = await fetch(`${API_BASE_URL}/api/bilibili/user-videos?uid=${uid}`, {
                    credentials: 'include'
                });
                const data = await response.json();

                if (data.success && data.videos) {
                    const userUrls = data.videos.map(v => v.url);
                    console.log(`UP主 ${uid} 获取到 ${userUrls.length} 个视频`);
                    allVideoUrls = [...allVideoUrls, ...userUrls];
                }
            } catch (e) {
                console.error(`UP主 ${uid} 处理失败:`, e);
            }

            await new Promise(r => setTimeout(r, 200));
        }

        // 3. 去重
        allVideoUrls = [...new Set(allVideoUrls)];
        console.log(`混合输入总共提取到 ${allVideoUrls.length} 个视频链接`);

        if (allVideoUrls.length === 0) {
            throw new Error('未能获取到任何视频链接');
        }

        // 4. 批量解析所有视频
        if (loadingTextEl) loadingTextEl.textContent = `正在解析 ${allVideoUrls.length} 个视频...`;
        await handleBatchParseNew(allVideoUrls);

        showToast(`成功处理混合输入：${allVideoUrls.length} 个视频`, 'success');

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
        if (parseBtn) parseBtn.disabled = false;
    }
}

// ==================== 用户投稿处理 ====================


async function handleUserVideosParse(uid) {
    if (!uid) {
        showToast('无法识别用户ID', 'error');
        return;
    }

    // 显示加载状态（添加 null 检查）
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    document.getElementById('batchSection')?.classList.add('hidden');

    const loadingTextEl = document.getElementById('loadingText');
    if (loadingTextEl) loadingTextEl.textContent = '正在获取UP主投稿...';
    const progressEl = document.getElementById('loadingProgress');
    if (progressEl) progressEl.classList.add('hidden');

    if (parseBtn) parseBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/bilibili/user-videos?uid=${uid}`, {
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success && data.videos) {
            // 转换为批量结果格式
            batchResults = data.videos.map(video => ({
                success: true,
                url: video.url,
                data: {
                    title: video.title,
                    author: video.author,
                    thumbnail: video.thumbnail,
                    duration: video.duration,
                    platform: '视频',
                    bvid: video.bvid
                }
            }));

            // 显示批量结果（适配新 HTML）
            const batchSectionEl = document.getElementById('batchSection');
            const batchListEl = document.getElementById('batchList');
            const batchCountEl = document.getElementById('batchCount');

            if (batchSectionEl) batchSectionEl.classList.remove('hidden');
            if (resultSection) resultSection.classList.add('hidden');
            if (batchListEl) {
                batchListEl.innerHTML = '';
                batchResults.forEach((result, index) => {
                    const item = document.createElement('div');
                    item.className = 'batch-item';
                    item.dataset.index = index;
                    const data = result.data;
                    let thumbnailUrl = data.thumbnail || '';
                    if (thumbnailUrl.startsWith('//')) thumbnailUrl = 'https:' + thumbnailUrl;
                    if (thumbnailUrl && (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com'))) {
                        thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
                    }
                    item.innerHTML = `
                        <img class="batch-thumb" src="${thumbnailUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 9\"><rect fill=\"%23334155\" width=\"16\" height=\"9\"/></svg>'}">
                        <div class="batch-info">
                            <div class="batch-title">${escapeHtml(data.title || '未知标题')}</div>
                            <div class="batch-status success"><i class="fas fa-check"></i> 处理成功</div>
                        </div>
                        <button onclick="downloadBatchItem(${index})" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-download"></i>
                        </button>
                    `;
                    batchListEl.appendChild(item);
                });
            }
            if (batchCountEl) batchCountEl.textContent = batchResults.length;

            showToast(`成功获取 ${data.videos.length} 个视频`, 'success');
        } else {
            throw new Error(data.error || '获取UP主投稿失败');
        }

    } catch (error) {
        showError(error.message);
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
        if (parseBtn) parseBtn.disabled = false;
    }
}

// ==================== GitHub Gist 云公告 ====================

async function loadGistAnnouncement() {
    try {
        if (!GIST_CONFIG.enabled) return;

        const response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.gistId}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' },
            cache: 'no-cache'
        });

        if (!response.ok) {
            console.log('Gist 加载失败');
            return;
        }

        const gistData = await response.json();
        const file = gistData.files[GIST_CONFIG.filename];

        if (!file || !file.content) return;

        // 解析 JSON 格式的公告
        let announcementInfo;
        try {
            announcementInfo = JSON.parse(file.content);
        } catch (e) {
            // 如果不是 JSON，当作纯文本处理
            announcementInfo = {
                id: gistData.updated_at,
                title: '公告通知',
                message: file.content,
                isActive: true
            };
        }

        // 检查公告是否激活
        if (!announcementInfo.isActive) return;

        // 检查是否是新公告（通过版本ID比较）
        const cachedVersion = localStorage.getItem(GIST_CONFIG.cacheKey);
        const currentVersion = announcementInfo.id || gistData.updated_at;
        const isNewAnnouncement = cachedVersion !== currentVersion;

        // 检查今日是否不再显示（仅对同一版本公告有效）
        const dontShowToday = localStorage.getItem('gistDontShowDate');
        const dontShowVersion = localStorage.getItem('gistDontShowVersion');
        const today = new Date().toDateString();

        const shouldShow = isNewAnnouncement || !(dontShowToday === today && dontShowVersion === currentVersion);

        gistAnnouncementData = {
            id: currentVersion,
            title: announcementInfo.title || '公告通知',
            message: announcementInfo.message || '',
            date: announcementInfo.date || '',
            updatedAt: gistData.updated_at,
            source: 'gist'
        };

        // 显示徽章
        const badge = document.getElementById('announcementBadge');
        if (badge && isNewAnnouncement) {
            badge.classList.remove('hidden');
        }

        // 自动弹出公告
        if (shouldShow) {
            setTimeout(() => showGistAnnouncement(), 500);
        }

    } catch (error) {
        console.log('公告加载失败:', error);
    }
}

function showGistAnnouncement() {
    const modal = document.getElementById('gistAnnouncementModal');
    const loading = document.getElementById('gistLoading');
    const content = document.getElementById('gistContent');
    const error = document.getElementById('gistError');

    modal.classList.remove('hidden');

    if (gistAnnouncementData && gistAnnouncementData.message) {
        loading.classList.add('hidden');
        error.classList.add('hidden');
        content.classList.remove('hidden');

        // 渲染公告内容
        let html = '';
        if (gistAnnouncementData.title) {
            html += `<h2>${escapeHtml(gistAnnouncementData.title)}</h2>`;
        }
        if (gistAnnouncementData.date) {
            html += `<p class="announcement-date"><i class="fas fa-calendar"></i> ${escapeHtml(gistAnnouncementData.date)}</p>`;
        }
        html += `<div class="announcement-message">${renderMarkdown(gistAnnouncementData.message)}</div>`;

        content.innerHTML = html;

        // 隐藏徽章
        const badge = document.getElementById('announcementBadge');
        if (badge) badge.classList.add('hidden');

        // 标记已读（保存版本）
        if (gistAnnouncementData.id) {
            localStorage.setItem(GIST_CONFIG.cacheKey, gistAnnouncementData.id);
        }
    } else {
        loading.classList.add('hidden');
        content.classList.add('hidden');
        error.classList.remove('hidden');
    }
}

function closeGistAnnouncement() {
    document.getElementById('gistAnnouncementModal').classList.add('hidden');
}

function toggleDontShowAgain() {
    const checkbox = document.getElementById('dontShowAgain');
    if (checkbox.checked) {
        localStorage.setItem('gistDontShowDate', new Date().toDateString());
        if (gistAnnouncementData && gistAnnouncementData.id) {
            localStorage.setItem('gistDontShowVersion', gistAnnouncementData.id);
        }
    } else {
        localStorage.removeItem('gistDontShowDate');
        localStorage.removeItem('gistDontShowVersion');
    }
}

// 简单的 Markdown 渲染
function renderMarkdown(text) {
    return text
        // 标题
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // 粗体和斜体
        .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // 链接
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        // 图片
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
        // 代码块
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        // 行内代码
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // 引用
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        // 无序列表
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
        // 分隔线
        .replace(/^---$/gm, '<hr>')
        // 换行
        .replace(/\n/g, '<br>');
}

// 检查登录状态
async function checkLoginStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bilibili/status`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success && data.isLoggedIn) {
            isLoggedIn = true;
            isVip = data.isVip || false;
            userInfo = data.userInfo;
        } else {
            isLoggedIn = false;
            isVip = false;
            userInfo = null;
        }
    } catch (error) {
        console.log('登录状态检查失败');
        isLoggedIn = false;
        isVip = false;
        userInfo = null;
    }

    // 无论成功与否都刷新 UI，避免状态不同步
    updateLoginUI();
}

function updateLoginUI() {
    // 旧版元素（兼容）
    const loginStatus = document.getElementById('loginStatus');
    const userInfoEl = document.getElementById('userInfo');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userVip = document.getElementById('userVip');

    // 新版头部元素
    const loginBtnArea = document.getElementById('loginBtnArea');
    const userInfoArea = document.getElementById('userInfoArea');
    const headerAvatar = document.getElementById('headerAvatar');
    const headerName = document.getElementById('headerName');
    const headerVipBadge = document.getElementById('headerVipBadge');

    // 统一的头像设置
    const applyAvatar = (el) => {
        if (!el) return;
        let avatarUrl = (userInfo && userInfo.avatar) || '';
        if (avatarUrl) {
            if (avatarUrl.startsWith('//')) avatarUrl = 'https:' + avatarUrl;
            if (avatarUrl.includes('bilibili.com') || avatarUrl.includes('hdslb.com')) {
                avatarUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(avatarUrl)}`;
            }
        }
        el.src = avatarUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23ccc"/><text x="12" y="16" text-anchor="middle" fill="%23999" font-size="12">头像</text></svg>';
        el.onerror = function () {
            this.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%23ccc"/><text x="12" y="16" text-anchor="middle" fill="%23999" font-size="12">头像</text></svg>';
        };
    };

    if (isLoggedIn && userInfo) {
        if (loginStatus) loginStatus.classList.add('hidden');
        if (userInfoEl) userInfoEl.classList.remove('hidden');
        if (loginBtnArea) loginBtnArea.classList.add('hidden');
        if (userInfoArea) userInfoArea.classList.remove('hidden');

        applyAvatar(userAvatar);
        applyAvatar(headerAvatar);

        if (userName) userName.textContent = userInfo.name || '用户';
        if (headerName) headerName.textContent = userInfo.name || '用户';

        if (userVip) userVip.classList[isVip ? 'remove' : 'add']('hidden');

        if (headerVipBadge) {
            headerVipBadge.classList.remove('hidden');
            if (isVip) {
                headerVipBadge.textContent = '大会员';
                headerVipBadge.classList.remove('normal');
            } else {
                headerVipBadge.textContent = '普通用户';
                headerVipBadge.classList.add('normal');
            }
        }
    } else {
        if (loginStatus) loginStatus.classList.remove('hidden');
        if (userInfoEl) userInfoEl.classList.add('hidden');
        if (loginBtnArea) loginBtnArea.classList.remove('hidden');
        if (userInfoArea) userInfoArea.classList.add('hidden');
        if (headerVipBadge) headerVipBadge.classList.add('hidden');
    }

    // 更新预设选项中的VIP状态
    updatePresetVipStatus();
}

// 显示登录弹窗
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
    getQRCode();
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    if (qrCheckInterval) {
        clearInterval(qrCheckInterval);
        qrCheckInterval = null;
    }
}

// 获取登录二维码（适配新 HTML）
async function getQRCode() {
    // 新 HTML 使用的元素 ID
    const qrImg = document.getElementById('qrImg');
    const qrText = document.getElementById('qrText');
    // 旧 HTML 使用的元素 ID（兼容）
    const qrcodeLoading = document.getElementById('qrcodeLoading');
    const qrcodeImg = document.getElementById('qrcodeImg');
    const qrcodeExpired = document.getElementById('qrcodeExpired');
    const loginStatusText = document.getElementById('loginStatusText');

    if (qrText) {
        qrText.style.display = 'block';
        qrText.textContent = '二维码加载中...';
    }
    if (qrImg) qrImg.style.display = 'none';

    if (qrcodeLoading) qrcodeLoading.classList.remove('hidden');
    if (qrcodeImg) qrcodeImg.classList.add('hidden');
    if (qrcodeExpired) qrcodeExpired.classList.add('hidden');
    if (loginStatusText) loginStatusText.textContent = '正在获取二维码...';

    try {
        const response = await fetch(`${API_BASE_URL}/api/bilibili/qrcode`);
        const data = await response.json();

        if (data.success && data.qrcodeUrl) {
            if (qrText) qrText.style.display = 'none';
            if (qrImg) {
                qrImg.src = data.qrcodeUrl;
                qrImg.style.display = 'block';
            }

            if (qrcodeLoading) qrcodeLoading.classList.add('hidden');
            if (qrcodeImg) {
                qrcodeImg.src = data.qrcodeUrl;
                qrcodeImg.classList.remove('hidden');
            }
            if (loginStatusText) loginStatusText.textContent = '请使用哔哩哔哩APP扫码';

            // 开始轮询检查登录状态
            startQRCodeCheck(data.qrcodeKey);
        } else {
            throw new Error(data.error || '获取二维码失败');
        }
    } catch (error) {
        if (qrText) {
            qrText.style.display = 'block';
            qrText.textContent = '获取二维码失败，请重试';
        }
        if (qrcodeLoading) qrcodeLoading.classList.add('hidden');
        if (loginStatusText) loginStatusText.textContent = '获取二维码失败，请重试';
        showToast(error.message, 'error');
    }
}

function refreshQRCode() {
    getQRCode();
}

// 轮询检查二维码状态（适配新 HTML）
function startQRCodeCheck(qrcodeKey) {
    if (qrCheckInterval) clearInterval(qrCheckInterval);

    let checkCount = 0;
    const maxChecks = 180; // 3分钟超时

    // 更新二维码状态显示
    const updateQrStatus = (status, message) => {
        const qrImg = document.getElementById('qrImg');
        const qrText = document.getElementById('qrText');
        const qrcodeImg = document.getElementById('qrcodeImg');
        const qrcodeExpired = document.getElementById('qrcodeExpired');
        const loginStatusText = document.getElementById('loginStatusText');

        if (status === 'expired' || status === 'error') {
            if (qrImg) qrImg.style.display = 'none';
            if (qrText) {
                qrText.style.display = 'block';
                qrText.textContent = message || '二维码已过期，请刷新';
                qrText.style.color = '#ff6b6b';
            }
            if (qrcodeImg) qrcodeImg.classList.add('hidden');
            if (qrcodeExpired) qrcodeExpired.classList.remove('hidden');
        } else if (status === 'scanned') {
            if (qrText) {
                qrText.style.display = 'block';
                qrText.textContent = '✓ 已扫码，请在手机上确认';
                qrText.style.color = '#52c41a';
            }
        } else if (status === 'success') {
            if (qrText) {
                qrText.style.display = 'block';
                qrText.textContent = '✓ 登录成功！';
                qrText.style.color = '#52c41a';
            }
        }
        if (loginStatusText) loginStatusText.textContent = message || '';
    };

    qrCheckInterval = setInterval(async () => {
        checkCount++;

        if (checkCount > maxChecks) {
            clearInterval(qrCheckInterval);
            updateQrStatus('expired', '二维码已过期，请点击刷新');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/bilibili/qrcode/check?key=${qrcodeKey}`);
            const data = await response.json();

            console.log('二维码状态检查:', data); // 调试日志

            // 处理成功响应
            if (data.success) {
                switch (data.status) {
                    case 'waiting':
                        // 等待扫码，无需更新UI
                        break;
                    case 'scanned':
                        updateQrStatus('scanned', '已扫码，请在手机上确认');
                        break;
                    case 'confirmed':
                        clearInterval(qrCheckInterval);
                        updateQrStatus('success', '登录成功！');
                        isLoggedIn = true;
                        isVip = data.isVip || false;
                        userInfo = data.userInfo;

                        // 更新UI但不刷新页面（保持搜索结果）
                        updateLoginUI();
                        closeLoginModal();

                        showToast('登录成功！', 'success');

                        // 不再刷新页面，保持处理搜索结果
                        break;
                    case 'expired':
                        clearInterval(qrCheckInterval);
                        updateQrStatus('expired', '二维码已过期，请点击刷新');
                        break;
                }
            } else {
                // 处理错误响应
                console.error('二维码检查失败:', data.error);
                if (data.error && data.error.includes('过期')) {
                    clearInterval(qrCheckInterval);
                    updateQrStatus('expired', '二维码已过期，请点击刷新');
                }
            }
        } catch (error) {
            console.error('检查登录状态失败:', error);
            // 网络错误不立即停止轮询，可能是临时问题
        }
    }, 2000); // 改为2秒轮询一次，减少请求频率
}

// 退出登录
async function logout() {
    try {
        await fetch(`${API_BASE_URL}/api/bilibili/logout`, { method: 'POST', credentials: 'include' });
    } catch (error) {
        console.error('退出登录失败:', error);
    }

    isLoggedIn = false;
    isVip = false;
    userInfo = null;

    // 更新UI但不刷新页面（保持搜索结果）
    updateLoginUI();

    showToast('已退出登录', 'success');

    // 不再刷新页面，保持处理搜索结果
}

// 处理视频 (保留为兼容方法，实际使用 handleSmartParse)
async function handleParse() {
    return handleSmartParse();
}

// 显示处理结果
async function displayResult(result) {
    // 重新检查登录状态（确保状态是最新的）
    await checkLoginStatus();

    // 保存当前视频数据，供下载使用
    currentVideoData = result;

    // 更新视频信息
    document.getElementById('videoPlatform').textContent = result.platform || '-';
    document.getElementById('videoTitle').textContent = result.title || '-';
    document.getElementById('videoAuthor').textContent = result.author || '-';
    document.getElementById('videoDuration').textContent = result.duration || '-';

    // 显示封面
    const coverImg = document.getElementById('coverImg');
    const coverPlayBtn = document.getElementById('coverPlayBtn');

    if (result.thumbnail) {
        // 处理视频封面的协议问题
        let thumbnailUrl = result.thumbnail;
        if (thumbnailUrl.startsWith('//')) {
            thumbnailUrl = 'https:' + thumbnailUrl;
        }

        // 使用代理加载视频封面（解决防盗链问题）
        if (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com')) {
            thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
        }

        coverImg.src = thumbnailUrl;
        coverImg.onerror = () => {
            coverImg.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><rect fill="%23334155" width="16" height="9"/><text x="8" y="5" text-anchor="middle" fill="%23666" font-size="2">无封面</text></svg>';
        };
    }

    // 设置播放链接
    if (coverPlayBtn && result.videoUrl) {
        coverPlayBtn.href = result.videoUrl;
    }

    // 更新下载按钮文本
    const downloadBtnText = document.getElementById('downloadBtnText');
    downloadBtnText.textContent = '下载视频';

    // 更新预设信息显示
    updatePresetInfoDisplay();

    // 显示结果区域
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 保存处理记录
    saveParseHistory(videoUrlInput.value.trim(), result);

    // 更新历史记录显示
    loadParseHistory();
}

// 生成画质列表（显示所有画质）
function generateQualityList(result) {
    const qualityList = document.getElementById('qualityList');
    qualityList.innerHTML = '';

    // 从后端获取所有画质选项（后端已返回完整列表）
    const availableQualities = result.downloadLinks || [];

    if (availableQualities.length === 0) {
        qualityList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">暂无可用画质</div>';
        return;
    }

    // 按画质从高到低排序
    const sortedQualities = [...availableQualities].sort((a, b) => (b.qn || 0) - (a.qn || 0));

    // 找到默认选中的画质（优先选择1080P，如果不可用则选择最高可用画质）
    let defaultQn = null;
    const preferredQn = sortedQualities.find(q => q.qn === 80);
    if (preferredQn) {
        const needVip = preferredQn.needVip !== undefined ? preferredQn.needVip : (preferredQn.qn > 80);
        const exists = preferredQn.exists !== undefined ? preferredQn.exists : true;
        if (exists && (!needVip || (isLoggedIn && isVip))) {
            defaultQn = 80;
        }
    }

    // 如果没有找到可用的1080P，选择最高可用画质
    if (!defaultQn) {
        const firstAvailable = sortedQualities.find(q => {
            const needVip = q.needVip !== undefined ? q.needVip : (q.qn > 80);
            const exists = q.exists !== undefined ? q.exists : true;
            return exists && (!needVip || (isLoggedIn && isVip));
        });
        if (firstAvailable) {
            defaultQn = firstAvailable.qn;
        } else if (sortedQualities.length > 0) {
            // 如果没有可用画质，至少选中第一个存在的（虽然可能会被禁用）
            const firstExists = sortedQualities.find(q => q.exists !== false);
            if (firstExists) {
                defaultQn = firstExists.qn;
            } else {
                defaultQn = sortedQualities[0].qn;
            }
        }
    }

    sortedQualities.forEach((quality) => {
        const qn = quality.qn || 80;
        const needVip = quality.needVip !== undefined ? quality.needVip : (qn > 80);
        const exists = quality.exists !== undefined ? quality.exists : true; // 默认认为存在
        const qualityName = quality.quality || getQualityName(qn);

        // 判断是否可以下载：
        // 1. 画质必须存在（exists为true）
        // 2. 不需要VIP，或者需要VIP但用户已登录且是VIP
        const canDownload = exists && (!needVip || (isLoggedIn && isVip));
        const isSelected = qn === defaultQn && canDownload;

        if (isSelected) {
            selectedQuality = qn;
        }

        const item = document.createElement('div');
        item.className = `quality-item ${isSelected ? 'selected' : ''} ${!canDownload ? 'disabled' : ''}`;
        item.dataset.qn = qn;
        item.dataset.needVip = needVip;
        item.dataset.exists = exists;

        // 显示状态文本（不显示"不可用"）
        let statusText = '';
        if (!exists) {
            // 不显示"不可用"，只通过禁用状态表示
            statusText = '';
        } else if (!canDownload) {
            if (needVip && !isLoggedIn) {
                statusText = '需要登录';
            } else if (needVip && !isVip) {
                statusText = '需要大会员';
            } else {
                statusText = '需要登录';
            }
        }

        // 滑动条布局
        item.innerHTML = `
            <span class="quality-name">${qualityName}</span>
            ${needVip ? '<span class="quality-tag vip">大会员</span>' : '<span class="quality-tag free">免费</span>'}
            ${statusText ? `<span class="quality-status">${statusText}</span>` : ''}
        `;

        // 所有画质都可以点击，但禁用画质会显示提示
        item.addEventListener('click', () => {
            if (canDownload) {
                selectQuality(item, qn);
            } else {
                if (!exists) {
                    showToast('此视频不支持该画质', 'error');
                } else if (needVip && !isLoggedIn) {
                    showToast('请先登录网站账号', 'error');
                    showLoginModal();
                } else if (needVip && !isVip) {
                    showToast('此画质需要大会员，请登录大会员账号', 'error');
                } else {
                    showToast('请先登录', 'error');
                }
            }
        });

        qualityList.appendChild(item);
    });
}

// 获取画质名称（整合 1080P60/高码率为 1080P 高帧率）
function getQualityName(qn) {
    const qualityMap = {
        127: '8K 超高清',
        126: '杜比视界',
        125: 'HDR 真彩',
        120: '4K 超清',
        116: '1080P 高帧率',  // 整合60帧和高码率
        112: '1080P 高帧率',
        80: '1080P',
        74: '720P60',
        64: '720P',
        32: '480P',
        16: '360P'
    };
    return qualityMap[qn] || `清晰度 ${qn}`;
}

// 选择格式
function selectFormat(format, element) {
    selectedFormat = format;

    // 更新按钮状态
    document.querySelectorAll('.format-slider-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    element.classList.add('active');

    // 更新滑动指示器位置
    updateSliderIndicator(element);

    // 更新画质选择器显示
    const qualitySelector = document.getElementById('qualitySelector');
    const downloadBtnText = document.getElementById('downloadBtnText');

    // 判断是否需要显示画质选择（有视频选项时显示）
    const hasVideo = format === 'video+audio' || format === 'video+audio-separate' || format === 'video-only';

    if (hasVideo) {
        qualitySelector.style.display = 'block';
    } else {
        qualitySelector.style.display = 'none';
    }

    // 更新下载按钮文字
    const formatTexts = {
        'video+audio': '下载视频+音频合体',
        'video+audio-separate': '下载视频+音频分离',
        'audio': '下载音频',
        'video-only': '下载视频（无音频）',
        'cover': '下载封面'
    };
    downloadBtnText.textContent = formatTexts[format] || '下载';
}

// 更新滑动指示器位置
function updateSliderIndicator(activeButton) {
    const indicator = document.querySelector('.format-slider-indicator');
    const track = document.querySelector('.format-slider-track');

    if (!indicator || !track || !activeButton) return;

    // 计算按钮在track中的位置
    const trackRect = track.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    // 计算相对于track的偏移量
    const left = buttonRect.left - trackRect.left;
    const width = buttonRect.width;

    // 设置指示器的位置和宽度
    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
}

// 更新画质滑动指示器位置（已改用背景色选中，此函数保留为空以保持兼容）
function updateQualitySliderIndicator(activeItem) {
    // 不再需要滑动指示器，改用背景色选中效果
}

// 选择画质
function selectQuality(element, qn) {
    document.querySelectorAll('.quality-item').forEach(item => {
        item.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedQuality = qn;

    // 自动滚动到选中项（如果不在可视区域内）
    const track = document.querySelector('.quality-slider-track');
    if (track && element) {
        const itemLeft = element.offsetLeft;
        const itemRight = itemLeft + element.offsetWidth;
        const trackWidth = track.clientWidth;
        const currentScroll = track.scrollLeft;

        // 如果选中项在左侧不可见，滚动到左侧
        if (itemLeft < currentScroll) {
            track.scrollTo({
                left: itemLeft - 10,
                behavior: 'smooth'
            });
        }
        // 如果选中项在右侧不可见，滚动到右侧
        else if (itemRight > currentScroll + trackWidth) {
            track.scrollTo({
                left: itemRight - trackWidth + 10,
                behavior: 'smooth'
            });
        }
    }
}

// 下载选中的格式和画质
async function downloadSelected() {
    if (!currentVideoData) {
        showToast('请先处理视频', 'error');
        return;
    }

    const downloadBtn = document.getElementById('downloadBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 准备下载...';

    try {
        const videoUrl = videoUrlInput.value.trim();
        const safeTitle = (currentVideoData.title || 'video').replace(/[<>:"/\\|?*]/g, '_');

        // 检查画质是否可用（需要画质的格式）
        const needsQuality = selectedFormat !== 'cover';
        if (needsQuality && !selectedQuality) {
            showToast('请先选择画质', 'error');
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
            return;
        }

        if (needsQuality) {
            const availableQualities = currentVideoData.downloadLinks || [];
            const selectedQualityInfo = availableQualities.find(q => q.qn === selectedQuality);

            if (selectedQualityInfo) {
                const needVip = selectedQualityInfo.needVip !== undefined ? selectedQualityInfo.needVip : (selectedQuality > 80);
                const exists = selectedQualityInfo.exists !== undefined ? selectedQualityInfo.exists : true;
                const canDownload = exists && (!needVip || (isLoggedIn && isVip));

                if (!canDownload) {
                    if (!exists) {
                        showToast('此视频不支持该画质', 'error');
                    } else if (needVip && !isLoggedIn) {
                        showToast('请先登录网站账号', 'error');
                        showLoginModal();
                    } else if (needVip && !isVip) {
                        showToast('此画质需要大会员，请登录大会员账号', 'error');
                    }
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = originalText;
                    return;
                }
            }
        }

        const encodedUrl = encodeURIComponent(videoUrl);
        const qn = selectedQuality || 80;

        // 根据格式执行下载
        if (selectedFormat === 'cover') {
            // 下载封面
            if (!currentVideoData.thumbnail) {
                showToast('该视频没有封面', 'error');
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = originalText;
                return;
            }
            const downloadUrl = `${API_BASE_URL}/api/bilibili/download/cover?url=${encodedUrl}`;
            downloadFile(downloadUrl, `${safeTitle}.jpg`);
        } else if (selectedFormat === 'video+audio-separate') {
            // 分离下载：先下载视频，再下载音频 - 使用选择的格式
            const videoFormat = appState.videoFormat || 'mp4';
            const audioFormat = appState.audioFormat || 'mp3';
            showToast('开始分离下载，将依次下载视频和音频...', 'success');

            // 下载视频 - 使用流式代理
            const videoUrl_dl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${qn}&type=video`;
            downloadFile(videoUrl_dl, `${safeTitle}_video.${videoFormat}`);

            // 延迟下载音频
            setTimeout(() => {
                const audioUrl_dl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${qn}&type=audio`;
                downloadFile(audioUrl_dl, `${safeTitle}_audio.${audioFormat}`);
            }, 1000);
        } else if (selectedFormat === 'audio') {
            // 下载音频 - 使用选择的音频格式
            const audioFormat = appState.audioFormat || 'mp3';
            const downloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${qn}&type=audio`;
            downloadFile(downloadUrl, `${safeTitle}.${audioFormat}`);
        } else if (selectedFormat === 'video-only') {
            // 下载视频（无音频）- 使用选择的视频格式
            const videoFormat = appState.videoFormat || 'mp4';
            const downloadUrl = `${API_BASE_URL}/api/bilibili/stream?url=${encodedUrl}&qn=${qn}&type=video`;
            downloadFile(downloadUrl, `${safeTitle}_video.${videoFormat}`);
        } else {
            // 下载视频+音频合体（默认）- 使用选择的视频格式
            const videoFormat = appState.videoFormat || 'mp4';
            const downloadUrl = `${API_BASE_URL}/api/bilibili/download?url=${encodedUrl}&qn=${qn}&format=${videoFormat}`;
            downloadFile(downloadUrl, `${safeTitle}.${videoFormat}`);
        }

        // 显示提示
        showToast('正在准备下载，请稍候...', 'success');

    } catch (error) {
        showToast('下载失败: ' + error.message, 'error');
    } finally {
        setTimeout(() => {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = originalText;
        }, 2000);
    }
}

// 下载文件辅助函数
// downloadFile 保留为别名，兼容旧代码
function downloadFile(url, filename) {
    triggerBrowserDownload(url, filename);
}

// 显示错误（兼容新 HTML）
function showError(message) {
    showToast(message, 'error');
}

// 公告管理
function showAdminModal() {
    document.getElementById('adminModal').classList.remove('hidden');
    loadAnnouncementForEdit();
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.add('hidden');
}

async function loadAnnouncementForEdit() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/announcement`);
        const data = await response.json();
        if (data.success) {
            document.getElementById('announcementInput').value = data.content || '';
        }
    } catch (error) {
        console.error('加载公告失败:', error);
    }
}

async function saveAnnouncement() {
    const content = document.getElementById('announcementInput').value.trim();

    try {
        const response = await fetch(`${API_BASE_URL}/api/announcement`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, adminKey: 'your-secret-key' })
        });

        const data = await response.json();
        if (data.success) {
            showToast('公告已保存', 'success');
            loadAnnouncement();
            closeAdminModal();
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        showToast('保存失败: ' + error.message, 'error');
    }
}

async function clearAnnouncement() {
    document.getElementById('announcementInput').value = '';
    await saveAnnouncement();
}

// 帮助页面
function showHelp() {
    showToast('使用说明：粘贴视频链接，点击去水印即可下载', 'success');
}

function showFAQ() {
    showToast('常见问题：如遇下载失败，请尝试登录网站账号', 'success');
}

function showFeedback() {
    showToast('反馈建议：请联系开发者', 'success');
}

// 处理记录管理
function saveParseHistory(url, result) {
    try {
        let history = JSON.parse(localStorage.getItem('parseHistory') || '[]');

        // 检查是否已存在（避免重复）
        const existingIndex = history.findIndex(item => item.url === url);
        if (existingIndex !== -1) {
            // 更新现有记录
            history[existingIndex] = {
                url: url,
                title: result.title || '未知视频',
                platform: result.platform || '未知平台',
                author: result.author || '未知作者',
                thumbnail: result.thumbnail || '',
                timestamp: Date.now()
            };
        } else {
            // 添加新记录
            history.unshift({
                url: url,
                title: result.title || '未知视频',
                platform: result.platform || '未知平台',
                author: result.author || '未知作者',
                thumbnail: result.thumbnail || '',
                timestamp: Date.now()
            });
        }

        // 限制最多保存50条记录
        if (history.length > 50) {
            history = history.slice(0, 50);
        }

        localStorage.setItem('parseHistory', JSON.stringify(history));
    } catch (error) {
        console.error('保存处理记录失败:', error);
    }
}

function loadParseHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('parseHistory') || '[]');
        const historyList = document.getElementById('historyList');

        if (history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">暂无处理记录</div>';
            return;
        }

        historyList.innerHTML = '';

        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';

            const timeStr = new Date(item.timestamp).toLocaleString('zh-CN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            historyItem.innerHTML = `
                <div class="history-info">
                    <div class="history-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
                    <div class="history-meta">
                        <span>${item.platform}</span>
                        <span>${item.author}</span>
                        <span>${timeStr}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="history-action-btn" onclick="parseFromHistory('${item.url.replace(/'/g, "\\'")}')" title="重新处理">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button class="history-action-btn" onclick="deleteHistoryItem(${index})" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            historyList.appendChild(historyItem);
        });
    } catch (error) {
        console.error('加载处理记录失败:', error);
    }
}

function parseFromHistory(url) {
    videoUrlInput.value = url;
    handleParse();
}

function deleteHistoryItem(index) {
    try {
        let history = JSON.parse(localStorage.getItem('parseHistory') || '[]');
        history.splice(index, 1);
        localStorage.setItem('parseHistory', JSON.stringify(history));
        loadParseHistory();
        showToast('已删除', 'success');
    } catch (error) {
        console.error('删除处理记录失败:', error);
    }
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 新 HTML 适配函数 ====================

// 初始化 UI（新 HTML 使用）
function initUI() {
    if (appState.theme === 'dark') document.body.classList.add('dark-theme');

    // 延迟初始化，确保 DOM 完全加载
    setTimeout(() => {
        // 恢复格式下拉菜单选择
        const formatDropdown = document.getElementById('formatDropdown');
        if (formatDropdown) {
            formatDropdown.value = appState.format || 'video+audio';
            setFormatFromDropdown(formatDropdown.value);
        }

        // 恢复画质选择
        const qBtn = document.querySelector(`#qualitySegment .segment-opt[data-val="${appState.quality}"]`);
        if (qBtn) {
            setPreset('quality', appState.quality, qBtn);
        } else {
            const defaultQBtn = document.querySelector(`#qualitySegment .segment-opt[data-val="80"]`);
            if (defaultQBtn) {
                setPreset('quality', 80, defaultQBtn);
            }
        }

        // 设置文件名格式
        const filenameFormatEl = document.getElementById('filenameFormat');
        if (filenameFormatEl) filenameFormatEl.value = appState.filenameFormat;
    }, 100);
}

// 设置预设（新 HTML 使用）
function setPreset(type, val, btn) {
    // 🔒 VIP画质权限检查（仅VIP画质需要登录和大会员）
    if (type === 'quality') {
        const needVip = val > 80; // 120(4K), 116(1080P60), 112(1080P+) 需要大会员
        // 1080P(80)及以下是免费画质，任何人都可选择
        if (needVip) {
            if (!isLoggedIn) {
                showToast('此画质需要登录网站账号', 'error');
                showLoginModal();
                return; // 阻止选择
            }
            if (!isVip) {
                showToast('此画质需要大会员权限', 'error');
                return; // 阻止选择
            }
        }
    }

    appState[type] = val;

    // 同步到旧变量（兼容）
    if (type === 'format') {
        presetFormat = val;
        selectedFormat = val;
    } else if (type === 'quality') {
        presetQuality = val;
        selectedQuality = val;
    }

    // 仅画质选择有滑动条按钮
    if (btn && btn.parentElement) {
        const container = btn.parentElement;
        container.querySelectorAll('.segment-opt').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
        moveGlider(container, btn);
    }

    if (type === 'format') {
        // 更新格式相关的显示逻辑
        const qRow = document.getElementById('qualitySegment');

        if (val === 'cover') {
            // 封面：画质选择变为禁用状态，但保持位置不变
            if (qRow) {
                qRow.style.opacity = '0.4';
                qRow.style.pointerEvents = 'none';
            }
        } else {
            // 其他模式：显示画质选择
            if (qRow) {
                qRow.style.opacity = '1';
                qRow.style.pointerEvents = 'auto';
            }
            setTimeout(() => {
                const activeQ = document.querySelector('#qualitySegment .segment-opt.active');
                if (activeQ && qRow) moveGlider(qRow, activeQ);
            }, 10);
        }
    }

    if (currentData || currentVideoData) updateDownloadHint();
}

// 从下拉菜单设置格式
function setFormatFromDropdown(val) {
    appState.format = val;
    localStorage.setItem('preset_format', val);
    presetFormat = val;
    selectedFormat = val;

    // 更新格式相关的显示逻辑
    const qRow = document.getElementById('qualitySegment');

    if (val === 'cover') {
        // 封面：画质选择变为禁用状态，但保持位置不变
        if (qRow) {
            qRow.style.opacity = '0.4';
            qRow.style.pointerEvents = 'none';
        }
    } else {
        // 其他模式：显示画质选择
        if (qRow) {
            qRow.style.opacity = '1';
            qRow.style.pointerEvents = 'auto';
        }
        setTimeout(() => {
            const activeQ = document.querySelector('#qualitySegment .segment-opt.active');
            if (activeQ && qRow) moveGlider(qRow, activeQ);
        }, 10);
    }

    if (currentData || currentVideoData) updateDownloadHint();
}

// 移动滑动指示器（新 HTML 使用）
function moveGlider(container, targetBtn) {
    const glider = container.querySelector('.glider');
    if (!glider || !targetBtn) return;

    // 使用 requestAnimationFrame 确保 DOM 更新后再计算位置
    requestAnimationFrame(() => {
        const cRect = container.getBoundingClientRect();
        const bRect = targetBtn.getBoundingClientRect();
        const left = bRect.left - cRect.left + container.scrollLeft;
        glider.style.width = `${bRect.width}px`;
        glider.style.transform = `translateX(${left}px)`;
        glider.style.opacity = '0.15'; // 确保可见
    });
}

// 显示单视频结果（新 HTML 使用）
function showSingleResult(data) {
    currentData = data;
    currentVideoData = data; // 兼容旧代码

    const resultSection = document.getElementById('resultSection');
    if (!resultSection) return;

    resultSection.classList.remove('hidden');

    const resTitle = document.getElementById('resTitle');
    const resAuthor = document.getElementById('resAuthor');
    const resDuration = document.getElementById('resDuration');
    const resCover = document.getElementById('resCover');
    const coverPlayBtn = document.getElementById('coverPlayBtn');

    if (resTitle) resTitle.innerText = data.title || '未知标题';
    if (resAuthor) resAuthor.innerHTML = `<i class="fas fa-user"></i> ${data.author || '未知UP主'}`;
    if (resDuration) resDuration.innerHTML = `<i class="far fa-clock"></i> ${data.duration || '00:00'}`;

    if (resCover && data.thumbnail) {
        let thumbnailUrl = data.thumbnail;
        if (thumbnailUrl.startsWith('//')) {
            thumbnailUrl = 'https:' + thumbnailUrl;
        }
        if (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com')) {
            thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
        }
        resCover.src = thumbnailUrl;
    }

    if (coverPlayBtn && data.videoUrl) {
        coverPlayBtn.href = data.videoUrl;
    }

    // 提取支持的画质列表
    if (data.downloadLinks && data.downloadLinks.length > 0) {
        data.qualities = data.downloadLinks
            .filter(link => link.exists !== false)
            .map(link => link.qn)
            .filter(qn => qn);
    } else {
        data.qualities = [80, 64, 32, 16]; // 默认免费画质
    }

    // 计算视频支持的最高画质
    data.maxQuality = data.qualities.length > 0 ? Math.max(...data.qualities) : 80;
    console.log('视频支持的最高画质:', data.maxQuality);

    // 所有免费画质都可选，不禁用任何按钮
    resetQualityButtons();

    updateDownloadHint();
}

// 重置画质按钮状态（所有免费画质都可选）
function resetQualityButtons() {
    const qualitySegment = document.getElementById('qualitySegment');
    if (!qualitySegment) return;

    const buttons = qualitySegment.querySelectorAll('.segment-opt');
    buttons.forEach(btn => {
        // 移除所有禁用状态
        btn.classList.remove('disabled', 'unsupported');
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
    });
}

// 更新下载提示（新 HTML 使用）
function updateDownloadHint() {
    const hintEl = document.getElementById('downloadHint');
    if (!hintEl) return;

    const data = currentData || currentVideoData;
    if (!data) return;

    if (appState.format === 'cover') {
        hintEl.innerText = "封面图片";
        return;
    }

    // 处理方式名称
    const formatNames = {
        'video+audio': '完整',
        'video+audio-separate': '分离'
    };
    const formatName = formatNames[appState.format] || '完整';

    const targetQ = appState.quality;
    const maxQ = data.maxQuality || 80;

    // 简单的画质名称映射
    const qNameMap = {
        120: '4K', 116: '1080P高帧率', 112: '1080P高帧率', 80: '1080P', 64: '720P', 32: '480P', 16: '360P'
    };
    const targetName = qNameMap[targetQ] || targetQ;
    const maxName = qNameMap[maxQ] || maxQ;

    // 画质降级提示只在登录后显示
    if (isLoggedIn && targetQ > maxQ) {
        hintEl.innerHTML = `原视频最高 <span style="color:#F59E0B">${maxName}</span>，将按此画质下载 · ${formatName}`;
    } else {
        hintEl.innerText = `${targetName} · ${formatName}`;
    }
}

// 删除了重复的 executeDownload 函数，使用第289行的版本

// 检查公告（新 HTML 使用）
async function checkAnnouncement(forceShow = false) {
    if (!GIST_CONFIG.enabled && !forceShow) return;

    // Check if "Don't Show Today" is active
    if (!forceShow) {
        const dontShowDate = localStorage.getItem('announcement_dont_show_date');
        const today = new Date().toDateString();
        if (dontShowDate === today) {
            return;
        }
    }

    try {
        const rawUrl = `https://gist.githubusercontent.com/${GIST_CONFIG.username}/${GIST_CONFIG.gistId}/raw/${GIST_CONFIG.filename}?t=${new Date().getTime()}`;
        const response = await fetch(rawUrl);
        if (!response.ok) throw new Error('Network error');

        // 确保使用 UTF-8 编码读取内容
        const content = await response.text();
        let parsedContent;
        let shouldShow = forceShow;
        let versionId = "";

        try {
            const json = JSON.parse(content);
            // 修复公告排版：移除重复的标题，只显示内容
            let message = json.message || '';
            // 如果消息包含 Markdown 标题，转换为 HTML
            message = message.replace(/## 📢 最新更新\n\n/g, '<h4 style="color:var(--primary); margin-bottom:15px; font-size:1.1rem;">📢 最新更新</h4>');
            message = message.replace(/## 📜 更新历史\n\n/g, '<h4 style="color:var(--primary); margin-top:20px; margin-bottom:15px; font-size:1.1rem;">📜 更新历史</h4>');
            // 将换行转换为 <br>
            message = message.replace(/\n/g, '<br>');

            parsedContent = `
                <h4 style="color:var(--primary); margin-bottom:15px; font-size:1.1rem;">${escapeHtml(json.title || '公告')}</h4>
                <div style="line-height:1.8; font-size:0.95rem; color:var(--text-main);">${message}</div>
                <p style="margin-top:15px; font-size:0.8rem; color:var(--text-gray); text-align:right;">${escapeHtml(json.date || new Date().toLocaleDateString())}</p>
            `;
            if (json.isActive === false && !forceShow) return;
            versionId = json.id || content.length;
        } catch (e) {
            // 如果不是 JSON，直接显示文本内容
            let textContent = escapeHtml(content);
            textContent = textContent.replace(/## 📢 最新更新\n\n/g, '<h4 style="color:var(--primary); margin-bottom:15px; font-size:1.1rem;">📢 最新更新</h4>');
            textContent = textContent.replace(/## 📜 更新历史\n\n/g, '<h4 style="color:var(--primary); margin-top:20px; margin-bottom:15px; font-size:1.1rem;">📜 更新历史</h4>');
            textContent = textContent.replace(/\n/g, '<br>');
            parsedContent = `<div style="white-space: pre-wrap; line-height:1.8; color:var(--text-main); font-size:0.95rem;">${textContent}</div>`;
            versionId = content.length;
        }

        const announcementContent = document.getElementById('announcementContent');
        const announcementModal = document.getElementById('announcementModal');

        if (shouldShow || !localStorage.getItem('gist_read_' + versionId)) {
            if (announcementContent) announcementContent.innerHTML = parsedContent;
            if (announcementModal) {
                announcementModal.classList.remove('hidden');
                const checkbox = document.getElementById('dontShowTodayCheckbox');
                if (checkbox) checkbox.checked = false;
            }

            if (!forceShow) localStorage.setItem('gist_read_' + versionId, 'true');
        }
    } catch (error) {
        if (forceShow) {
            const announcementContent = document.getElementById('announcementContent');
            const announcementModal = document.getElementById('announcementModal');
            if (announcementContent) announcementContent.innerHTML = '<p style="text-align:center; color:var(--text-gray);">无法加载公告</p>';
            if (announcementModal) announcementModal.classList.remove('hidden');
        }
    }
}

// 关闭公告（新 HTML 使用）
function closeAnnouncement() {
    const checkbox = document.getElementById('dontShowTodayCheckbox');
    if (checkbox && checkbox.checked) {
        const today = new Date().toDateString();
        localStorage.setItem('announcement_dont_show_date', today);
    }
    const announcementModal = document.getElementById('announcementModal');
    if (announcementModal) announcementModal.classList.add('hidden');
}

// 切换历史记录下拉菜单（新 HTML 使用）
function toggleHistory(e) {
    if (e) e.stopPropagation();
    const historyDropdown = document.getElementById('historyDropdown');
    if (historyDropdown) historyDropdown.classList.toggle('active');
}

// 保存历史记录（新 HTML 使用）
function saveHistory(url, title, author) {
    let history = JSON.parse(localStorage.getItem('parse_history') || '[]');
    history = history.filter(h => h.url !== url);
    history.unshift({ url, title, author, time: new Date().toLocaleDateString() });
    if (history.length > 20) history.pop();
    localStorage.setItem('parse_history', JSON.stringify(history));
    loadHistoryToDropdown();
}

// 加载历史记录到下拉菜单（新 HTML 使用）
function loadHistoryToDropdown() {
    const list = document.getElementById('historyDropdownList');
    if (!list) return;

    const history = JSON.parse(localStorage.getItem('parse_history') || '[]');

    if (history.length === 0) {
        list.innerHTML = '<div style="padding:15px; text-align:center; color:var(--text-gray); font-size:0.85rem;">暂无历史记录</div>';
        return;
    }

    list.innerHTML = '';
    history.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'history-row';
        div.onclick = () => {
            if (videoUrlInput) videoUrlInput.value = item.url;
            const historyDropdown = document.getElementById('historyDropdown');
            if (historyDropdown) historyDropdown.classList.remove('active');
            handleSmartParse();
        };
        div.innerHTML = `
            <div class="history-row-content">
                <div class="history-row-title">${escapeHtml(item.title || item.url)}</div>
                <div class="history-row-meta">${escapeHtml(item.author || '未知')} · ${escapeHtml(item.time || '')}</div>
            </div>
            <div class="history-row-delete" onclick="deleteHistoryItem(event, ${idx})"><i class="fas fa-times"></i></div>
        `;
        list.appendChild(div);
    });
}

// 删除历史记录项（新 HTML 使用）
function deleteHistoryItem(e, idx) {
    if (e) e.stopPropagation();
    let history = JSON.parse(localStorage.getItem('parse_history') || '[]');
    history.splice(idx, 1);
    localStorage.setItem('parse_history', JSON.stringify(history));
    loadHistoryToDropdown();
}

// 清空历史记录（新 HTML 使用）
function clearHistory() {
    localStorage.removeItem('parse_history');
    loadHistoryToDropdown();
}

// 清空所有（输入框 + 处理结果）
function clearAll() {
    // 清空输入框
    const videoUrlInput = document.getElementById('videoUrl');
    if (videoUrlInput) {
        videoUrlInput.value = '';
    }

    // 隐藏单视频结果
    const resultSection = document.getElementById('resultSection');
    if (resultSection) {
        resultSection.classList.add('hidden');
    }

    // 隐藏批量结果
    const batchSection = document.getElementById('batchSection');
    if (batchSection) {
        batchSection.classList.add('hidden');
    }

    // 清空批量列表
    const batchList = document.getElementById('batchList');
    if (batchList) {
        batchList.innerHTML = '';
    }

    // 重置全局数据
    currentData = null;
    currentVideoData = null;
    batchResults = [];

}

// 检查登录状态（新 HTML 使用）
function checkLogin() {
    return checkLoginStatus();
}

// 更新 handleSmartParse 以适配新 HTML（包装原函数）
const originalHandleSmartParse = handleSmartParse;
handleSmartParse = async function () {
    const input = videoUrlInput ? videoUrlInput.value.trim() : '';
    if (!input) {
        alert('请输入链接');
        return;
    }

    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    const batchSectionEl = document.getElementById('batchSection');
    if (batchSectionEl) batchSectionEl.classList.add('hidden');

    try {
        // 🔧 先检测收藏夹和UP主（优先级最高）
        const inputType = detectInputType(input);
        console.log('输入类型检测:', inputType); // 调试日志

        if (inputType.type === 'mixed') {
            // 🔧 混合类型：收藏夹+视频、UP主+视频等
            await handleMixedParse(inputType);
            return;
        }

        if (inputType.type === 'favorites') {
            await handleFavoritesParse(inputType.id);
            return;
        }

        if (inputType.type === 'user') {
            await handleUserVideosParse(inputType.uid);
            return;
        }

        if (inputType.type === 'multi') {
            // 批量处理
            await handleBatchParseNew(inputType.urls);
            return;
        }

        if (inputType.type === 'single') {
            // 单链接处理
            await handleSingleParse(inputType.url);
            return;
        }

        // 兼容：尝试提取链接
        const urls = extractBilibiliUrls(input);
        console.log('提取到的视频链接:', urls); // 调试日志

        if (urls.length > 1) {
            await handleBatchParseNew(urls);
        } else if (urls.length === 1) {
            await handleSingleParse(urls[0]);
        } else {
            throw new Error('无法识别输入内容，请检查是否为视频链接、收藏夹或用户主页');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
    }
};

// 更新 handleBatchParse 以适配新 HTML（保留原函数，添加新版本）
async function handleBatchParseNew(urls) {
    if (!urls || urls.length === 0) {
        alert('请输入至少一个有效链接');
        return;
    }

    const batchSectionEl = document.getElementById('batchSection');
    const batchListEl = document.getElementById('batchList');
    const batchCountEl = document.getElementById('batchCount');

    if (batchSectionEl) batchSectionEl.classList.remove('hidden');
    if (batchListEl) batchListEl.innerHTML = '';
    if (batchCountEl) batchCountEl.textContent = '0';

    batchResults = [];
    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < urls.length; i++) {
        // 显示处理中状态
        if (batchListEl) {
            const item = document.createElement('div');
            item.className = 'batch-item';
            item.innerHTML = `
                <div class="batch-thumb"></div>
                <div class="batch-info">
                    <div class="batch-title">正在处理... ${escapeHtml(urls[i])}</div>
                </div>
            `;
            batchListEl.appendChild(item);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/parse`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: urls[i] })
            });

            const data = await response.json();

            if (data.success) {
                batchResults.push({
                    success: true,
                    url: urls[i],
                    data: data.data
                });
                successCount++;

                // 更新列表项
                if (batchListEl && batchListEl.children[i]) {
                    const resultData = data.data;
                    let thumbnailUrl = resultData.thumbnail || '';
                    if (thumbnailUrl.startsWith('//')) thumbnailUrl = 'https:' + thumbnailUrl;
                    if (thumbnailUrl && (thumbnailUrl.includes('bilibili.com') || thumbnailUrl.includes('hdslb.com'))) {
                        thumbnailUrl = `${API_BASE_URL}/api/proxy/image?url=${encodeURIComponent(thumbnailUrl)}`;
                    }

                    batchListEl.children[i].innerHTML = `
                        <img class="batch-thumb" src="${thumbnailUrl || 'data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 9\"><rect fill=\"%23334155\" width=\"16\" height=\"9\"/></svg>'}">
                        <div class="batch-info">
                            <div class="batch-title">${escapeHtml(resultData.title || '未知标题')}</div>
                            <div class="batch-status success"><i class="fas fa-check"></i> 处理成功</div>
                        </div>
                        <button onclick="downloadBatchItem(${i})" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-download"></i>
                        </button>
                    `;
                }
            } else {
                batchResults.push({
                    success: false,
                    url: urls[i],
                    error: data.error || '处理失败'
                });
                failedCount++;

                // 更新列表项显示错误
                if (batchListEl && batchListEl.children[i]) {
                    batchListEl.children[i].innerHTML = `
                        <div class="batch-info">
                            <div class="batch-title">${escapeHtml(urls[i])}</div>
                            <div class="batch-status error"><i class="fas fa-times"></i> ${escapeHtml(data.error || '处理失败')}</div>
                        </div>
                        <button onclick="retryBatchItem(${i})" style="background:var(--blue); color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">
                            <i class="fas fa-redo"></i>
                        </button>
                    `;
                }
            }
        } catch (error) {
            batchResults.push({
                success: false,
                url: urls[i],
                error: error.message || '网络错误'
            });
            failedCount++;

            // 更新列表项显示错误
            if (batchListEl && batchListEl.children[i]) {
                batchListEl.children[i].innerHTML = `
                    <div class="batch-info">
                        <div class="batch-title">${escapeHtml(urls[i])}</div>
                        <div class="batch-status error"><i class="fas fa-times"></i> ${escapeHtml(error.message || '网络错误')}</div>
                    </div>
                `;
            }
        }

        if (batchCountEl) batchCountEl.textContent = batchResults.length;

        // 稍微延迟避免请求过快
        if (i < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
        }
    }

    // 更新计数
    if (batchCountEl) batchCountEl.textContent = batchResults.length;
}


function clearBatch() {
    if (batchSection) batchSection.classList.add('hidden');
    batchResults = [];
    if (batchList) batchList.innerHTML = '';
    if (batchCount) batchCount.textContent = '0';
}

// ==================== 背景图系统 (二次元美少女) ====================

// 背景图配置 - 二次元美少女图片（支持本地图片）
const bgConfig = {
    // 统一背景图池（不区分白天黑夜，3分钟自动切换）
    images: [
        'https://img.paulzzh.com/touhou/random', // 东方Project随机图 (质量高)
        'https://www.dmoe.cc/random.php', // 随机二次元美少女
    ],
    // 轮换间隔（毫秒）：3分钟 = 180000ms
    rotateInterval: 180000,
    // 当前使用的图片索引
    currentIndex: 0
};

// 背景图轮换定时器
let bgRotateTimer = null;

// 更新背景图逻辑（不随主题切换，3分钟自动轮换）
function updateBackgroundImage() {
    const bgElement = document.getElementById('backgroundImage');
    if (!bgElement || !bgConfig.images || bgConfig.images.length === 0) return;

    // 按顺序选择图片（循环）
    let url = bgConfig.images[bgConfig.currentIndex];

    // 如果 url 为空，跳过
    if (!url) {
        bgConfig.currentIndex = 0;
        return;
    }

    // 如果是API链接，添加时间戳防止缓存
    if (url.startsWith('http')) {
        url += (url.includes('?') ? '&' : '?') + 't=' + new Date().getTime();
    }

    // 图片预加载
    const img = new Image();
    img.src = url;

    img.onload = () => {
        // 直接设置背景图，让CSS控制透明度和滤镜
        bgElement.style.backgroundImage = `url('${url}')`;
        // 清除内联样式，让CSS类控制效果
        bgElement.style.opacity = '';
        bgElement.style.filter = '';

        // 更新索引，下次使用下一张
        bgConfig.currentIndex = (bgConfig.currentIndex + 1) % bgConfig.images.length;
    };

    img.onerror = () => {
        console.warn('背景图加载失败，跳过到下一张');
        // 加载失败时跳过到下一张
        bgConfig.currentIndex = (bgConfig.currentIndex + 1) % bgConfig.images.length;
        // 如果还有图片，尝试加载下一张
        if (bgConfig.images.length > 0) {
            setTimeout(() => updateBackgroundImage(), 1000);
        } else {
            // 没有可用图片时使用渐变
            const isDark = document.body.classList.contains('dark-theme');
            if (isDark) {
                bgElement.style.backgroundImage = 'linear-gradient(135deg, #2d1934 0%, #231428 50%, #321937 100%)';
            } else {
                bgElement.style.backgroundImage = 'linear-gradient(135deg, #ffeef5 0%, #fff0f5 50%, #ffe4ec 100%)';
            }
        }
    };
}

// 切换主题（新 HTML 使用）
function toggleTheme() {
    if (!appState) {
        appState = {
            format: 'video+audio',
            quality: 80,
            videoFormat: 'mp4',
            audioFormat: 'mp3',
            theme: localStorage.getItem('theme') || 'light',
            filenameFormat: localStorage.getItem('filename_format') || 'title'
        };
    }

    const isDark = document.body.classList.contains('dark-theme');
    const newTheme = isDark ? 'light' : 'dark';

    if (newTheme === 'light') {
        document.body.classList.remove('dark-theme');
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
        document.body.classList.add('dark-theme');
    }

    appState.theme = newTheme;
    localStorage.setItem('theme', appState.theme);

    // 注意：背景图不再随主题切换，保持3分钟自动轮换

    // 同步到旧变量（兼容）
    if (appSettings) {
        appSettings.theme = appState.theme;
        localStorage.setItem('appSettings', JSON.stringify(appSettings));
    }
}

// 初始化背景图（含轮换定时器）
function initBackgroundImage() {
    const backgroundImage = document.getElementById('backgroundImage');
    if (!backgroundImage) {
        console.warn('背景图容器未找到');
        return;
    }

    // 恢复上次的图片索引（从localStorage）
    const savedIndex = localStorage.getItem('bg_currentIndex');
    if (savedIndex !== null) {
        bgConfig.currentIndex = parseInt(savedIndex) || 0;
    }

    // 初始化背景（不依赖主题）
    updateBackgroundImage();

    // 启动背景图轮换定时器（每3分钟换一张）
    startBackgroundRotation();

    console.log('背景图已初始化，每3分钟自动轮换，不随主题切换');
}

// 启动背景图轮换
function startBackgroundRotation() {
    // 清除旧定时器
    if (bgRotateTimer) {
        clearInterval(bgRotateTimer);
    }

    // 每3分钟轮换一次背景图（不随主题切换）
    bgRotateTimer = setInterval(() => {
        console.log('背景图轮换中...');
        updateBackgroundImage();
        // 保存当前索引
        localStorage.setItem('bg_currentIndex', bgConfig.currentIndex.toString());
    }, bgConfig.rotateInterval);
}

// 停止背景图轮换
function stopBackgroundRotation() {
    if (bgRotateTimer) {
        clearInterval(bgRotateTimer);
        bgRotateTimer = null;
    }
}

// 更新 saveSettings 以适配新 HTML
const originalSaveSettings = saveSettings;
saveSettings = function () {
    const filenameFormatEl = document.getElementById('filenameFormat');
    if (filenameFormatEl) {
        appState.filenameFormat = filenameFormatEl.value;
        localStorage.setItem('filename_format', appState.filenameFormat);
    }
};

// 更新 handleSingleParse 以适配新 HTML
const originalHandleSingleParse = handleSingleParse;
handleSingleParse = async function (url) {
    if (loadingSection) loadingSection.classList.remove('hidden');
    if (resultSection) resultSection.classList.add('hidden');
    if (batchSection) batchSection.classList.add('hidden');
    if (parseBtn) parseBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const data = await response.json();

        if (data.success) {
            currentVideoData = data.data;
            currentData = data.data; // 新 HTML 使用

            // 保存历史记录
            saveHistory(url, data.data.title, data.data.author);

            // 显示结果
            showSingleResult(data.data);
        } else {
            throw new Error(data.error || '处理失败');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        if (loadingSection) loadingSection.classList.add('hidden');
        if (parseBtn) parseBtn.disabled = false;
    }
};

// 导出全局函数
window.showLoginModal = showLoginModal;
window.closeLoginModal = closeLoginModal;
window.refreshQRCode = refreshQRCode;
window.logout = logout;
window.downloadSelected = downloadSelected;
window.downloadWithPreset = downloadWithPreset;
window.selectFormat = selectFormat;
window.parseFromHistory = parseFromHistory;
window.deleteHistoryItem = deleteHistoryItem;
window.showAdminModal = showAdminModal;
window.closeAdminModal = closeAdminModal;
window.saveAnnouncement = saveAnnouncement;
window.clearAnnouncement = clearAnnouncement;
window.showHelp = showHelp;
window.showFAQ = showFAQ;
window.showFeedback = showFeedback;
// 智能处理
window.handleSmartParse = handleSmartParse;
window.downloadBatchItem = downloadBatchItem;
window.retryBatchItem = retryBatchItem;
window.downloadAllBatch = downloadAllBatch;
window.clearBatchResults = clearBatchResults;
// Gist 公告
window.showGistAnnouncement = showGistAnnouncement;
window.closeGistAnnouncement = closeGistAnnouncement;
window.toggleDontShowAgain = toggleDontShowAgain;
// 预设选项
window.selectPresetFormat = selectPresetFormat;
window.selectPresetQuality = selectPresetQuality;
window.selectPresetOutput = selectPresetOutput;
// 设置
window.toggleSettings = toggleSettings;
window.toggleTheme = toggleTheme; // 新 HTML 使用 toggleTheme
window.setTheme = toggleTheme; // 兼容旧代码
window.saveSettings = saveSettings;
// 新 HTML 使用的函数
window.setPreset = setPreset;
window.setFormatFromDropdown = setFormatFromDropdown;
window.resetQualityButtons = resetQualityButtons;
window.moveGlider = moveGlider;
window.showSingleResult = showSingleResult;
window.executeDownload = executeDownload;
window.checkAnnouncement = checkAnnouncement;
window.closeAnnouncement = closeAnnouncement;
window.toggleHistory = toggleHistory;
window.loadHistoryToDropdown = loadHistoryToDropdown;
window.deleteHistoryItem = deleteHistoryItem;
window.clearHistory = clearHistory;
window.clearAll = clearAll;
window.checkLogin = checkLogin;
window.clearBatch = clearBatch;
window.initUI = initUI;

// 关于我们弹窗
function showAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) modal.classList.remove('hidden');
}

function closeAboutModal() {
    const modal = document.getElementById('aboutModal');
    if (modal) modal.classList.add('hidden');
}

// 使用说明弹窗
function showUsageModal() {
    const modal = document.getElementById('usageModal');
    if (modal) modal.classList.remove('hidden');
}

function closeUsageModal() {
    const modal = document.getElementById('usageModal');
    if (modal) modal.classList.add('hidden');
}

// 建议反馈弹窗
function showFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.classList.remove('hidden');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedbackModal');
    if (modal) modal.classList.add('hidden');
}














// 显示提示消息
function showToast(message, type = 'success') {
    // 使用现有的toast系统或创建新的
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}