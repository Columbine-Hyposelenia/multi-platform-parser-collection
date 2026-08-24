const axios = require('axios');
const ytdlpService = require('./ytdlpService');
const bilibiliService = require('./bilibiliService');


/**
 * 多平台视频解析服务
 * 整合多种解析方法，提供统一的解析接口
 */
class MultiPlatformService {
    constructor() {
        // 支持的平台配置
        this.platforms = {
            bilibili: {
                name: 'B站',
                patterns: [/bilibili\.com/, /b23\.tv/],
                favicon: 'https://www.bilibili.com/favicon.ico'
            },
            douyin: {
                name: '抖音',
                patterns: [/douyin\.com/, /iesdouyin\.com/],
                favicon: 'https://www.douyin.com/favicon.ico'
            },
            kuaishou: {
                name: '快手',
                patterns: [/kuaishou\.com/, /v\.kuaishou\.com/],
                favicon: 'https://www.kuaishou.com/favicon.ico'
            },
            youtube: {
                name: 'YouTube',
                patterns: [/youtube\.com/, /youtu\.be/],
                favicon: 'https://www.youtube.com/favicon.ico'
            },
            weibo: {
                name: '微博',
                patterns: [/weibo\.com/, /weibo\.cn/],
                favicon: 'https://weibo.com/favicon.ico'
            },
            xigua: {
                name: '西瓜视频',
                patterns: [/ixigua\.com/],
                favicon: 'https://www.ixigua.com/favicon.ico'
            },
            xiaohongshu: {
                name: '小红书',
                patterns: [/xiaohongshu\.com/, /xhslink\.com/],
                favicon: 'https://www.xiaohongshu.com/favicon.ico'
            },
            tiktok: {
                name: 'TikTok',
                patterns: [/tiktok\.com/],
                favicon: 'https://www.tiktok.com/favicon.ico'
            },
            twitter: {
                name: 'Twitter/X',
                patterns: [/twitter\.com/, /x\.com/],
                favicon: 'https://twitter.com/favicon.ico'
            },
            instagram: {
                name: 'Instagram',
                patterns: [/instagram\.com/],
                favicon: 'https://www.instagram.com/favicon.ico'
            }
        };
    }

    /**
     * 检测URL属于哪个平台
     */
    detectPlatform(url) {
        const lowerUrl = url.toLowerCase();
        for (const [key, platform] of Object.entries(this.platforms)) {
            for (const pattern of platform.patterns) {
                if (pattern.test(lowerUrl)) {
                    return { key, ...platform };
                }
            }
        }
        return null;
    }

    /**
     * 获取支持的平台列表
     */
    getSupportedPlatforms() {
        return Object.entries(this.platforms).map(([key, platform]) => ({
            key,
            name: platform.name,
            favicon: platform.favicon
        }));
    }

    /**
     * 解析视频
     */
    async parseVideo(url) {
        const platform = this.detectPlatform(url);

        if (!platform) {
            throw new Error('不支持的视频平台');
        }

        console.log(`[MultiPlatformService] 解析 ${platform.name} 视频: ${url}`);

        // 优先尝试使用 yt-dlp
        const ytdlpCheck = await ytdlpService.checkAvailable();
        if (ytdlpCheck.available) {
            try {
                console.log('[MultiPlatformService] 尝试使用 yt-dlp 解析...');
                const info = await ytdlpService.getVideoInfo(url);

                return {
                    title: info.title || `${platform.name}视频`,
                    author: info.uploader || info.channel || info.creator || '未知作者',
                    duration: ytdlpService.formatDuration(info.duration),
                    thumbnail: info.thumbnail || info.thumbnails?.[0]?.url || '',
                    platform: platform.name,
                    videoUrl: url,
                    downloadLinks: this.formatYtdlpFormats(info.formats, url)
                };
            } catch (ytdlpError) {
                console.log('[MultiPlatformService] yt-dlp 解析失败:', ytdlpError.message);
            }
        }

        // 所有解析方法均失败
        throw new Error('所有解析方法均失败，请检查链接或稍后重试');
    }

    /**
     * 批量解析多个链接
     */
    async parseMultiple(urls) {
        const results = [];

        for (const url of urls) {
            try {
                const result = await this.parseVideo(url.trim());
                results.push({
                    success: true,
                    url: url,
                    data: result
                });
            } catch (error) {
                results.push({
                    success: false,
                    url: url,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * 解析B站收藏夹
     */
    async parseBilibiliFavorites(favId, cookies = null) {
        const results = [];
        let page = 1;
        const pageSize = 20;

        try {
            while (true) {
                const headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Referer': 'https://www.bilibili.com/'
                };

                if (cookies) {
                    headers['Cookie'] = typeof cookies === 'string'
                        ? cookies
                        : Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ');
                }

                const response = await axios.get(
                    `https://api.bilibili.com/x/v3/fav/resource/list?media_id=${favId}&pn=${page}&ps=${pageSize}&platform=web`,
                    { headers, timeout: 15000 }
                );

                if (response.data.code !== 0) {
                    throw new Error(response.data.message || '获取收藏夹失败');
                }

                const data = response.data.data;
                if (!data || !data.medias || data.medias.length === 0) {
                    break;
                }

                for (const media of data.medias) {
                    if (media.type === 2) { // 视频类型
                        results.push({
                            title: media.title,
                            author: media.upper?.name || '未知UP主',
                            thumbnail: media.cover,
                            duration: this.formatSeconds(media.duration),
                            bvid: media.bvid,
                            url: `https://www.bilibili.com/video/${media.bvid}`,
                            platform: 'B站'
                        });
                    }
                }

                // 检查是否还有更多
                if (!data.has_more) {
                    break;
                }

                page++;

                // 限制最多获取200个视频
                if (results.length >= 200) {
                    break;
                }
            }

            return {
                success: true,
                total: results.length,
                videos: results
            };

        } catch (error) {
            throw new Error(`解析收藏夹失败: ${error.message}`);
        }
    }

    /**
     * 解析B站用户投稿
     * 策略：先尝试 WBI API，失败后自动使用 yt-dlp 备选方案
     */
    async parseBilibiliUserVideos(userId, cookies = null) {
        const results = [];
        let page = 1;
        const pageSize = 30;

        try {
            const cookieStr = await bilibiliService.getEffectiveCookieWithTicket(cookies);

            while (true) {
                // 使用 WBI 签名（参考 BBDown 实现）
                const baseParams = {
                    mid: userId,
                    pn: page,
                    ps: pageSize,
                    order: 'pubdate',
                    tid: 0
                };

                const signedParams = await bilibiliService.encWbi(baseParams, cookies);

                const headers = {
                    ...bilibiliService.headers,
                    'Cookie': cookieStr,
                    'Referer': `https://space.bilibili.com/${userId}/video`
                };

                const queryString = new URLSearchParams(signedParams).toString();
                const response = await axios.get(
                    `https://api.bilibili.com/x/space/wbi/arc/search?${queryString}`,
                    { headers, timeout: 15000 }
                );

                if (response.data.code !== 0) {
                    throw new Error(response.data.message || '获取用户视频失败');
                }

                const data = response.data.data;
                if (!data || !data.list || !data.list.vlist || data.list.vlist.length === 0) {
                    break;
                }

                for (const video of data.list.vlist) {
                    results.push({
                        title: video.title,
                        author: video.author,
                        thumbnail: video.pic,
                        duration: video.length,
                        bvid: video.bvid,
                        url: `https://www.bilibili.com/video/${video.bvid}`,
                        platform: 'B站',
                        playCount: video.play,
                        created: video.created
                    });
                }

                const total = data.page?.count || 0;
                if (results.length >= total || results.length >= 200) {
                    break;
                }

                page++;
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            return {
                success: true,
                total: results.length,
                videos: results
            };

        } catch (error) {
            // WBI API 失败，尝试使用 yt-dlp 备选方案
            console.log('WBI API 失败，尝试 yt-dlp 备选方案...');
            try {
                const ytdlpResult = await ytdlpService.getBilibiliUserVideos(userId);
                if (ytdlpResult.success && ytdlpResult.videos.length > 0) {
                    console.log(`✅ yt-dlp 成功获取 ${ytdlpResult.videos.length} 个视频`);
                    return ytdlpResult;
                }
            } catch (ytdlpError) {
                console.log('yt-dlp 备选方案也失败:', ytdlpError.message);
            }

            throw new Error(`解析用户投稿失败: ${error.message}。建议：1. 登录B站账号后重试 2. 稍后再试`);
        }
    }




    /**
     * 格式化 yt-dlp 返回的格式列表
     */
    formatYtdlpFormats(formats, originalUrl) {
        if (!formats || formats.length === 0) {
            return [{
                quality: '原始视频',
                url: originalUrl,
                needYtdlp: true
            }];
        }

        // 按分辨率分组
        const qualityMap = new Map();

        formats.forEach(format => {
            if (!format.height) return;

            const height = format.height;
            const key = height;

            if (!qualityMap.has(key) || (format.filesize && qualityMap.get(key).filesize < format.filesize)) {
                qualityMap.set(key, format);
            }
        });

        // 转换为下载链接列表
        const downloadLinks = [];

        // 按分辨率排序
        const sortedHeights = Array.from(qualityMap.keys()).sort((a, b) => b - a);

        sortedHeights.forEach(height => {
            const format = qualityMap.get(height);
            let qualityName = `${height}P`;

            if (height >= 2160) qualityName = '4K';
            else if (height >= 1440) qualityName = '2K';
            else if (height >= 1080) qualityName = '1080P';
            else if (height >= 720) qualityName = '720P';
            else if (height >= 480) qualityName = '480P';
            else if (height >= 360) qualityName = '360P';

            downloadLinks.push({
                quality: qualityName,
                formatId: format.format_id,
                url: originalUrl,
                size: format.filesize ? this.formatFileSize(format.filesize) : null,
                needYtdlp: true
            });
        });

        // 如果没有找到合适的格式，添加默认选项
        if (downloadLinks.length === 0) {
            downloadLinks.push({
                quality: '最佳质量',
                url: originalUrl,
                needYtdlp: true
            });
        }

        return downloadLinks;
    }

    /**
     * 格式化秒数为时间字符串
     */
    formatSeconds(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * 格式化文件大小
     */
    formatFileSize(bytes) {
        if (!bytes) return null;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    /**
     * 从URL提取收藏夹ID
     */
    extractFavId(url) {
        // https://space.bilibili.com/xxx/favlist?fid=123456
        // https://www.bilibili.com/medialist/detail/ml123456
        const fidMatch = url.match(/fid=(\d+)/);
        if (fidMatch) return fidMatch[1];

        const mlMatch = url.match(/ml(\d+)/);
        if (mlMatch) return mlMatch[1];

        return null;
    }

    /**
     * 从URL提取用户ID
     */
    extractUserId(url) {
        // https://space.bilibili.com/123456
        const match = url.match(/space\.bilibili\.com\/(\d+)/);
        return match ? match[1] : null;
    }
}

module.exports = new MultiPlatformService();

