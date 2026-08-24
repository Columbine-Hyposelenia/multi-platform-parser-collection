# YouTube 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 免登录 |
| **备用专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 免登录 |

## 主用：yt-dlp

- **Stars**: 186,000+ | **技术栈**: Python
- **覆盖媒体**: 视频（最高 8K、HDR、VR 360°、高帧率 60/120fps）、音频、字幕、播放列表、频道
- **质量**: YouTube 提供的最高质量版本，h264/av1/vp9 多编码，bestvideo+bestaudio 自动合并
- **网页部署**: Python 库嵌入后端 / metube Web UI / 封装 HTTP API
- **稳定性**: 业界事实标准，维护极其活跃，YouTube 反爬应对最快

## 备用：cobalt

- **技术栈**: Node.js
- **覆盖媒体**: YouTube 视频、音乐、Shorts（8K/4K/HDR/VR/高帧率）
- **质量**: 无水印，多音轨，丰富元数据
- **网页部署**: 纯 API 后端，Docker 部署，返回直链无缓存
- **适用场景**: 轻量 API 服务，或 yt-dlp 更新间隙的临时备用

## 注意事项

- YouTube 反爬较强，建议使用最新版 yt-dlp
- 高清格式需 FFmpeg 音视频合并
- cobalt 公开实例可能被 YouTube 限制，建议自托管
