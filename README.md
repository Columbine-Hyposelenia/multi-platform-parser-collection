# 多平台无水印解析开源项目合集

> 覆盖国内外主流平台的无水印媒体解析开源项目集合，按平台分类收录，每个重点平台配备**唯一主专用解析 + 备用专用解析 + 通用解析兜底**三重保障，确保稳定获取原始文件或平台最高质量文件。

## 收录标准

- **无水印**：解析结果必须去除平台水印，返回原始文件或最高质量版本
- **网页友好**：提供 HTTP API / 可作为后端服务部署 / 可嵌入网页应用
- **免费开源**：完全免费，代码开源可审计
- **维护活跃**：近期有提交，社区口碑良好，接口稳定
- **媒体全覆盖**：支持视频、图片、音频、实况图(Live Photo)等多种媒体类型

## 平台分类速查表

| 平台 | 主专用解析 | 备用专用解析 | 通用解析兜底 |
|------|-----------|-------------|-------------|
| 🇨🇳 抖音 Douyin | [Douyin_TikTok_Download_API](./douyin/Douyin_TikTok_Download_API/) | [parse-video-py](./douyin/parse-video-py/) | yt-dlp / cobalt / parse-video / media-parser |
| 🌍 TikTok | [Douyin_TikTok_Download_API](./douyin/Douyin_TikTok_Download_API/) | [cobalt](./universal/cobalt/) | yt-dlp |
| 🇨🇳 B站 Bilibili | [bilibili-parser](./bilibili/bilibili-parser/) | [BBDownT](./bilibili/BBDownT/) | yt-dlp / Douyin_TikTok_Download_API |
| 🇨🇳 小红书 Xiaohongshu | [XHS-Downloader](./xiaohongshu/XHS-Downloader/) | [rednote-api](./xiaohongshu/rednote-api/) | media-parser / parse-video / watermark-remover-server |
| 🇨🇳 快手 Kuaishou | [KS-Downloader](./kuaishou/KS-Downloader/) | [Douyin_TikTok_Download_API](./douyin/Douyin_TikTok_Download_API/) | parse-video / media-parser |
| 🌍 YouTube | [yt-dlp](./universal/yt-dlp/) | [cobalt](./universal/cobalt/) | gallery-dl |
| 🌍 X / Twitter | [cobalt](./universal/cobalt/) | [gallery-dl](./universal/gallery-dl/) | yt-dlp |
| 🌍 Pixiv | [gallery-dl](./universal/gallery-dl/) | [PixiC](./pixiv/PixiC/) | — |
| 🇨🇳 微博 Weibo | [watermark-remover-server](./other/watermark-remover-server/) | [media-parser](./universal/media-parser/) | parse-video |
| 🇨🇳 其他平台 | — | — | parse-video / media-parser / yt-dlp / cobalt |

## 目录结构

```
.
├── README.md                    # 本文件（总览 + 速查表）
├── universal/                   # 通用解析项目（跨平台兜底）
│   ├── yt-dlp/                  # 视频/音频通用解析（186k+ stars）
│   ├── cobalt/                  # API 优先的通用媒体下载（40k+ stars）
│   ├── gallery-dl/              # 图片通用解析（19k+ stars，Pixiv/Twitter 强项）
│   ├── parse-video/             # Go 语言国内多平台解析（22+ 平台）
│   └── media-parser/            # Python RESTful API，26 平台，支持 Live 实况
├── douyin/                      # 抖音
│   ├── Douyin_TikTok_Download_API/  # 主用：抖音+TikTok 异步解析 API
│   └── parse-video-py/          # 备用：Python 多平台解析
├── tiktok/                      # TikTok（国际版）
│   └── README.md                # 主用指向 douyin 目录项目，备用为 cobalt
├── bilibili/                    # B站
│   ├── bilibili-parser/         # 主用：Web 端解析，支持 4K/HDR/杜比
│   └── BBDownT/                 # 备用：最高质量下载器，支持 8K/HDR/杜比视界
├── xiaohongshu/                 # 小红书
│   ├── XHS-Downloader/          # 主用：图文/视频全格式，API 模式，Docker
│   └── rednote-api/             # 备用：Rust+Axum 高性能 API
├── kuaishou/                    # 快手
│   └── KS-Downloader/           # 主用：无水印视频/图片/音乐，API 模式
├── youtube/                     # YouTube
│   └── README.md                # 主用 yt-dlp，备用 cobalt
├── x-twitter/                   # X / Twitter
│   └── README.md                # 主用 cobalt，备用 gallery-dl
├── pixiv/                       # Pixiv
│   └── PixiC/                   # 备用：Pixiv 专用批量下载+API
└── other/                       # 其他平台
    └── watermark-remover-server/ # 微博/公众号/抖音/小红书/快手多平台
```

## 通用解析项目详解

### 1. yt-dlp (`universal/yt-dlp/`)
- **Stars**: 186,000+ | **语言**: Python | **协议**: Unlicense
- **定位**: 业界最强大的通用视频/音频解析器，支持 1000+ 网站
- **平台覆盖**: YouTube(8K/HDR/VR/高帧率)、Bilibili、抖音、TikTok、Twitter/X、Vimeo、SoundCloud 等
- **媒体类型**: 视频、音频、字幕、播放列表
- **网页部署**: 可作为 Python 库嵌入后端，或配合 metube 等 Web UI
- **质量**: 可获取平台提供的最高质量，支持 bestvideo+bestaudio 合并

### 2. cobalt (`universal/cobalt/`)
- **Stars**: 40,000+ | **语言**: JavaScript/Node.js | **协议**: AGPL-3.0
- **定位**: API 优先的通用媒体下载器，无广告、无追踪、无缓存
- **平台覆盖**: YouTube(8K/4K/HDR/VR)、TikTok(无水印视频/图集/原始音频)、X/Twitter(视频/GIF/多图)、Instagram、Reddit、SoundCloud、Vimeo、Pinterest 等 20+ 平台
- **媒体类型**: 视频、音频、图片、GIF
- **网页部署**: Docker 一键部署，纯 API 后端，可直接对接前端
- **特点**: 自托管友好，返回直链或重定向，不存储用户数据

### 3. gallery-dl (`universal/gallery-dl/`)
- **Stars**: 19,000+ | **语言**: Python | **协议**: GPL-2.0
- **定位**: 命令行图片/图集批量下载工具，图片解析领域最强
- **平台覆盖**: Pixiv(原图/动图)、Twitter/X(原图/多图)、Instagram、Reddit、Tumblr、Danbooru 等 40+ 图站
- **媒体类型**: 图片、动图(ugoira→zip/webm)、图集
- **网页部署**: 可作为 Python 库调用，支持配置文件和 OAuth
- **质量**: 直接获取原图 URL，不经过压缩

### 4. parse-video (`universal/parse-video/`)
- **语言**: Go | **协议**: MIT
- **定位**: 国内短视频平台多平台解析器，Go 语言高性能
- **平台覆盖**: 抖音、快手、火山、微视、最右、全民小视频、皮皮虾、西瓜视频、虎牙、梨视频、AcFun、好看视频等 22+ 平台视频；抖音/快手/小红书/皮皮虾/微博图集
- **媒体类型**: 视频、图集
- **网页部署**: 可编译为后端服务，提供解析接口

### 5. media-parser (`universal/media-parser/`)
- **语言**: Python | **协议**: 开源
- **定位**: 高性能 RESTful API 解析去水印服务
- **平台覆盖**: 抖音、快手、小红书等 26 个主流平台
- **媒体类型**: 作者、标题、封面、视频、图集、音频、Live 实况图
- **网页部署**: 下载器工厂模式，RESTful API，专为小程序/Web 后端设计
- **特点**: 不依赖第三方解析服务，核心逻辑全本地

## 各平台专用解析说明

各平台目录下的 `README.md` 详细说明了该平台的主用/备用/通用方案选择理由、部署方式和 API 用法。

## 使用建议

1. **优先使用主专用解析**：针对特定平台优化，质量和稳定性最佳
2. **主用失败时切换备用**：备用项目采用不同技术路线，可规避单点故障
3. **通用解析作为兜底**：yt-dlp / cobalt / gallery-dl 覆盖极广，小众平台或专用解析失效时使用
4. **组合部署**：建议将主用+备用+通用同时部署，通过路由层自动切换

## 免责声明

本仓库仅收录开源项目代码，供学习研究使用。使用者需遵守各平台服务条款及相关法律法规，不得用于侵犯版权或其他非法用途。各项目版权归原作者所有。

## 收录日期

2026-08-24
