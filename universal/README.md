# 通用解析项目

本目录收录跨平台通用解析项目，作为各重点平台的兜底方案，同时覆盖大量小众平台。

## 项目列表

### 1. yt-dlp
- **Stars**: 186,000+ | **语言**: Python
- **定位**: 业界最强通用视频/音频解析器
- **覆盖**: 1000+ 网站，YouTube/B站/抖音/TikTok/Twitter/Vimeo/SoundCloud 等
- **强项**: YouTube 8K/HDR/VR，音视频自动合并，字幕/播放列表
- **部署**: Python 库嵌入 / metube Web UI / 封装 API

### 2. cobalt
- **Stars**: 40,000+ | **语言**: Node.js
- **定位**: API 优先的通用媒体下载器
- **覆盖**: YouTube/TikTok/X(Twitter)/Instagram/Reddit/SoundCloud/Vimeo/Pinterest 等 20+
- **强项**: 纯 API 无缓存，TikTok 无水印+原始音频，Twitter 多图选择
- **部署**: Docker 一键部署 API 后端

### 3. gallery-dl
- **Stars**: 19,000+ | **语言**: Python
- **定位**: 图片/图集批量下载最强工具
- **覆盖**: Pixiv/Twitter/Instagram/Reddit/Tumblr/Danbooru 等 40+ 图站
- **强项**: 原图质量，Pixiv 动图，Twitter 多图，批量画师/收藏下载
- **部署**: Python 库调用 / CLI / 配置文件

### 4. parse-video
- **语言**: Go | **协议**: MIT
- **定位**: 国内短视频多平台高性能解析
- **覆盖**: 抖音/快手/火山/微视/最右/西瓜/虎牙/梨视频/AcFun/好看视频等 22+ 平台视频；抖音/快手/小红书/皮皮虾/微博图集
- **强项**: Go 语言高性能，国内平台覆盖广
- **部署**: 编译为后端服务

### 5. media-parser
- **语言**: Python
- **定位**: 高性能 RESTful API 解析去水印服务
- **覆盖**: 抖音/快手/小红书等 26 个主流平台
- **强项**: 支持 Live 实况图，下载器工厂模式，专为 Web/小程序后端设计
- **部署**: RESTful API 服务，不依赖第三方解析

## 通用兜底策略

当专用解析项目因平台 API 变更而失效时，按以下优先级切换通用兜底：

1. **视频类**: yt-dlp → cobalt → parse-video
2. **图片类**: gallery-dl → media-parser → parse-video
3. **国内平台**: parse-video → media-parser → yt-dlp
4. **国外平台**: cobalt → yt-dlp → gallery-dl
