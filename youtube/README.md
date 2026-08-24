# YouTube 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 业界最强，8K/HDR/VR/高帧率，1000+站点 |
| **备用专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | API 优先，YouTube 视频/音乐/Shorts |
| **备用链** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合，YouTube 视频+音乐 |
| **通用兜底** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 缩略图等资源 |

## 主用项目：yt-dlp

- **Stars**: 186,000+ | **语言**: Python
- **特点**:
  - YouTube 解析的事实标准
  - 最高 8K、HDR、VR 360°、高帧率(60/120fps)
  - h264/av1/vp9 多编码
  - bestvideo+bestaudio 自动合并最高质量
  - 字幕、弹幕、播放列表、频道批量
  - 丰富元数据提取
- **网页部署**: Python 库嵌入后端 / metube Web UI / 封装 API
- **质量**: YouTube 提供的最高质量版本

## 备用项目：cobalt

- **技术栈**: Node.js
- **特点**:
  - YouTube 视频、音乐、Shorts
  - 8K/4K/HDR/VR/高帧率
  - 多音轨，丰富元数据
  - 纯 API，返回直链，无缓存
- **适用场景**: 轻量 API 服务，或 yt-dlp 更新间隙

## 注意事项

- YouTube 反爬较强，建议使用最新版 yt-dlp
- 高清格式需 FFmpeg 音视频合并
- cobalt 公开实例可能被 YouTube 限制，建议自托管
