# YouTube 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 业界最强 YouTube 解析，支持 8K/HDR/VR/高帧率 |
| **备用专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | API 优先，支持 YouTube 视频/音乐/Shorts |
| **通用兜底** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 可用于 YouTube 缩略图等资源提取 |

## 主用项目：yt-dlp

- **技术栈**: Python
- **Stars**: 186,000+
- **特点**:
  - YouTube 解析的事实标准，支持所有视频格式
  - 最高支持 8K 分辨率、HDR、VR 360°、高帧率(60/120fps)
  - 支持 h264/av1/vp9 多种编码
  - 支持 bestvideo+bestaudio 自动合并为最高质量
  - 支持字幕、弹幕、播放列表、频道批量下载
  - 丰富的元数据提取（标题、描述、上传者、时间等）
- **网页部署**:
  - 作为 Python 库直接嵌入后端服务
  - 配合 metube 等项目提供 Web UI
  - 可封装为 RESTful API
- **质量**: 可获取 YouTube 提供的最高质量版本，支持原始音视频流分离后合并

## 备用项目：cobalt

- **技术栈**: Node.js
- **特点**:
  - 支持 YouTube 视频、音乐、Shorts
  - 支持 8K、4K、HDR、VR、高帧率视频
  - 丰富的元数据和多音轨支持
  - 纯 API，返回直链，无缓存
- **适用场景**: 需要轻量 API 服务时，或 yt-dlp 更新间隙的备用

## 注意事项

- YouTube 反爬机制较强，建议使用最新版本 yt-dlp
- 部分高清格式需要 FFmpeg 进行音视频合并
- cobalt 公开实例可能被 YouTube 限制，建议自托管
