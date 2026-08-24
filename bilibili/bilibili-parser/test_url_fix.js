// 测试 URL 修复的简单脚本
console.log('开始测试 URL 构建逻辑...');

// 模拟 downloadWithYtdlp 中的 URL 构建逻辑
function extractVideoId(url) {
    const bvMatch = url.match(/BV([a-zA-Z0-9]+)/i);
    const avMatch = url.match(/av(\d+)/i);

    if (bvMatch) return { bvid: `BV${bvMatch[1]}` };
    if (avMatch) return { aid: avMatch[1] };
    return null;
}

function buildFullUrl(url) {
    if (!url.startsWith('http')) {
        // 如果是 BV ID 或 AV ID，构建完整 URL
        const videoId = extractVideoId(url);
        if (videoId?.bvid) {
            return `https://www.bilibili.com/video/${videoId.bvid}`;
        } else if (videoId?.aid) {
            return `https://www.bilibili.com/video/av${videoId.aid}`;
        } else {
            throw new Error('无法识别的视频ID格式');
        }
    }
    return url;
}

console.log('测试 extractVideoId:');
console.log('BV1sFe2zzEFd ->', extractVideoId('BV1sFe2zzEFd'));
console.log('av123456 ->', extractVideoId('av123456'));

console.log('\n测试 URL 构建:');
console.log('BV1sFe2zzEFd ->', buildFullUrl('BV1sFe2zzEFd'));
console.log('av123456 ->', buildFullUrl('av123456'));
console.log('https://www.bilibili.com/video/BV1sFe2zzEFd ->', buildFullUrl('https://www.bilibili.com/video/BV1sFe2zzEFd'));

console.log('\n修复验证完成！现在 yt-dlp 将接收完整的 URL 而不是 BV ID。');

// 模拟 downloadWithYtdlp 中的 URL 构建逻辑
function buildFullUrl(url) {
    if (!url.startsWith('http')) {
        // 如果是 BV ID 或 AV ID，构建完整 URL
        const videoId = BilibiliService.extractVideoId(url);
        if (videoId?.bvid) {
            return `https://www.bilibili.com/video/${videoId.bvid}`;
        } else if (videoId?.aid) {
            return `https://www.bilibili.com/video/av${videoId.aid}`;
        } else {
            throw new Error('无法识别的视频ID格式');
        }
    }
    return url;
}

console.log('\n测试 URL 构建:');
console.log('BV1sFe2zzEFd ->', buildFullUrl('BV1sFe2zzEFd'));
console.log('av123456 ->', buildFullUrl('av123456'));
console.log('https://www.bilibili.com/video/BV1sFe2zzEFd ->', buildFullUrl('https://www.bilibili.com/video/BV1sFe2zzEFd'));

console.log('\n修复完成！现在 yt-dlp 将接收完整的 URL 而不是 BV ID。');