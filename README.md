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
| 🇨🇳 抖音 Douyin | [Douyin_TikTok_Download_API](./douyin/Douyin_TikTok_Download_API/) | [parsehub](./universal/parsehub/) | yt-dlp / cobalt / parse-video / media-parser |
| 🌍 TikTok | [Douyin_TikTok_Download_API](./douyin/Douyin_TikTok_Download_API/) | [cobalt](./universal/cobalt/) → [parsehub](./universal/parsehub/) | yt-dlp |
| 🇨🇳 B站 Bilibili | [BBDownT](./bilibili/BBDownT/)（最高质量8K/HDR/杜比） | [bilibili-parser](./bilibili/bilibili-parser/)（Web免登录） | yt-dlp / parsehub / cobalt |
| 🇨🇳 小红书 Xiaohongshu | [XHS-Downloader](./xiaohongshu/XHS-Downloader/) | [rednote-api](./xiaohongshu/rednote-api/) → [parsehub](./universal/parsehub/) | media-parser / parse-video / gallery-dl |
| 🇨🇳 快手 Kuaishou | [KS-Downloader](./kuaishou/KS-Downloader/) | [parsehub](./universal/parsehub/) → [Douyin_TikTok_Download_API](./douyin/Douyin_TikTok_Download_API/) | parse-video / media-parser / yt-dlp |
| 🇨🇳 微博 Weibo | [parsehub](./universal/parsehub/) | [watermark-remover-server](./other/watermark-remover-server/) | gallery-dl / parse-video |
| 🇨🇳 百度贴吧 Tieba | [Tieba-API-SCF](./tieba/Tieba-API-SCF/) | [parsehub](./universal/parsehub/) | — |
| 🇨🇳 豆包 Doubao | [doubao-nomark](./doubao/doubao-nomark/)（无印豆包） | — | — |
| 🌍 YouTube | [yt-dlp](./universal/yt-dlp/)（8K/HDR/VR） | [cobalt](./universal/cobalt/) → [parsehub](./universal/parsehub/) | — |
| 🌍 X / Twitter | [cobalt](./universal/cobalt/) | [FxEmbed](./x-twitter/FxEmbed/)（fxtwitter嵌入）→ [parsehub](./universal/parsehub/) | gallery-dl / yt-dlp |
| 🌍 Instagram | [instaloader](./instagram/instaloader/) | [cobalt](./universal/cobalt/) → [parsehub](./universal/parsehub/) | gallery-dl |
| 🌍 Pixiv | [gallery-dl](./universal/gallery-dl/)（原图/动图） | [pixivpy-async](./pixiv/pixivpy-async/)（异步API）→ [PixiC](./pixiv/PixiC/) | — |
| 🌍 Reddit | [cobalt](./universal/cobalt/) | [gallery-dl](./universal/gallery-dl/) | yt-dlp |
| 🌍 SoundCloud | [cobalt](./universal/cobalt/) | [yt-dlp](./universal/yt-dlp/) | — |
| 🌍 Twitch | [cobalt](./universal/cobalt/) | [yt-dlp](./universal/yt-dlp/) | — |
| 🌍 Pinterest | [gallery-dl](./universal/gallery-dl/) | — | — |
| 🇨🇳 小黑盒等小众 | [parsehub](./universal/parsehub/) | — | yt-dlp / cobalt |

## 目录结构

```
.
├── README.md                    # 本文件（总览 + 速查表）
├── universal/                   # 通用解析项目（跨平台兜底）
│   ├── yt-dlp/                  # 视频/音频通用解析（186k+ stars）
│   ├── cobalt/                  # API 优先的通用媒体下载（40k+ stars）
│   ├── gallery-dl/              # 图片通用解析（19k+ stars，Pixiv/Twitter强项）
│   ├── parse-video/             # Go 语言国内多平台解析（22+ 平台）
│   ├── media-parser/            # Python RESTful API，26 平台，支持 Live 实况
│   └── parsehub/                # Python 异步聚合解析库（抖音/TikTok/小红书/微博/贴吧/B站/Instagram/YouTube等）
├── douyin/                      # 抖音
│   ├── Douyin_TikTok_Download_API/  # 主用：抖音+TikTok 异步解析 API
│   └── parse-video-py/          # 备用：Python 多平台解析
├── tiktok/                      # TikTok（国际版）
│   └── README.md                # 主用指向 douyin 目录项目，备用为 cobalt/parsehub
├── bilibili/                    # B站
│   ├── BBDownT/                 # 主用：最高质量下载器，8K/HDR/杜比视界
│   └── bilibili-parser/         # 备用：Web 端解析，免登录，4K/HDR
├── xiaohongshu/                 # 小红书
│   ├── XHS-Downloader/          # 主用：图文/视频全格式，API 模式，Docker
│   └── rednote-api/             # 备用：Rust+Axum 高性能 API
├── kuaishou/                    # 快手
│   └── KS-Downloader/           # 主用：无水印视频/图片/音乐，API 模式
├── weibo/                       # 微博
│   └── README.md                # 主用 parsehub，备用 watermark-remover-server
├── tieba/                       # 百度贴吧
│   └── Tieba-API-SCF/           # 主用：HTTP API 服务，基于 Hono + tieba.js
├── doubao/                      # 豆包
│   └── doubao-nomark/           # 主用：无印豆包，AI 图片/视频无水印解析
├── youtube/                     # YouTube
│   └── README.md                # 主用 yt-dlp，备用 cobalt
├── x-twitter/                   # X / Twitter
│   ├── FxEmbed/                 # 备用：fxtwitter 嵌入修复，标准化 JSON
│   └── README.md                # 主用 cobalt，备用 FxEmbed/parsehub
├── instagram/                   # Instagram
│   └── instaloader/             # 主用：13k+ stars，图片/视频/Stories
├── pixiv/                       # Pixiv
│   ├── pixivpy-async/           # 备用：异步 Pixiv API 库
│   └── PixiC/                   # 备用：Pixiv 专用批量下载+API
├── other/                       # 其他平台
│   └── watermark-remover-server/ # 微博/公众号/抖音/小红书/快手多平台
└── reddit/                      # Reddit（通用覆盖）
    └── README.md
```

## 通用解析项目详解

### 1. yt-dlp (`universal/yt-dlp/`)
- **Stars**: 186,000+ | **语言**: Python | **协议**: Unlicense
- **定位**: 业界最强大的通用视频/音频解析器，支持 1000+ 网站
- **平台覆盖**: YouTube(8K/HDR/VR/高帧率)、Bilibili、抖音、TikTok、Twitter/X、Vimeo、SoundCloud、Twitch 等
- **媒体类型**: 视频、音频、字幕、播放列表
- **网页部署**: 可作为 Python 库嵌入后端，或配合 metube 等 Web UI
- **质量**: 可获取平台提供的最高质量，支持 bestvideo+bestaudio 合并

### 2. cobalt (`universal/cobalt/`)
- **Stars**: 40,000+ | **语言**: JavaScript/Node.js | **协议**: AGPL-3.0
- **定位**: API 优先的通用媒体下载器，无广告、无追踪、无缓存
- **平台覆盖**: YouTube(8K/4K/HDR/VR)、TikTok(无水印视频/图集/原始音频)、X/Twitter(视频/GIF/多图)、Instagram、Reddit、SoundCloud、Vimeo、Pinterest、Twitch 等 20+ 平台
- **媒体类型**: 视频、音频、图片、GIF
- **网页部署**: Docker 一键部署，纯 API 后端，可直接对接前端

### 3. gallery-dl (`universal/gallery-dl/`)
- **Stars**: 19,000+ | **语言**: Python | **协议**: GPL-2.0
- **定位**: 命令行图片/图集批量下载工具，图片解析领域最强
- **平台覆盖**: Pixiv(原图/动图)、Twitter/X(原图/多图)、Instagram、Reddit、Tumblr、Pinterest、Danbooru 等 40+ 图站
- **媒体类型**: 图片、动图(ugoira→zip/webm)、图集
- **网页部署**: 可作为 Python 库调用，支持配置文件和 OAuth

### 4. parsehub (`universal/parsehub/`)
- **语言**: Python (异步) | **协议**: MIT | **PyPI**: parsehub
- **定位**: 轻量、异步、开箱即用的社交媒体聚合解析库
- **平台覆盖**: 抖音/TikTok(视频+图文)、小红书(视频+图文)、微博(视频+图文)、百度贴吧(视频+图文)、B站(视频+动态)、Instagram(视频+图文)、YouTube(视频+音乐)、Facebook、Threads 等
- **媒体类型**: 视频、图文、音乐、动态
- **网页部署**: `pip install parsehub`，异步 API 可直接嵌入 FastAPI/后端服务
- **特点**: 依赖 yt-dlp 作为底层引擎，统一封装国内+国外平台，维护活跃（月更）

### 5. parse-video (`universal/parse-video/`)
- **语言**: Go | **协议**: MIT
- **定位**: 国内短视频平台多平台解析器，Go 语言高性能
- **平台覆盖**: 抖音、快手、火山、微视、最右、全民小视频、皮皮虾、西瓜视频、虎牙、梨视频、AcFun、好看视频等 22+ 平台视频；抖音/快手/小红书/皮皮虾/微博图集

### 6. media-parser (`universal/media-parser/`)
- **语言**: Python
- **定位**: 高性能 RESTful API 解析去水印服务
- **平台覆盖**: 抖音、快手、小红书等 26 个主流平台
- **媒体类型**: 作者、标题、封面、视频、图集、音频、Live 实况图
- **特点**: 下载器工厂模式，不依赖第三方解析服务，核心逻辑全本地

## 各平台专用解析说明

各平台目录下的 `README.md` 详细说明了该平台的主用/备用/通用方案选择理由、部署方式和 API 用法。

## 使用建议

1. **优先使用主专用解析**：针对特定平台优化，质量和稳定性最佳
2. **主用失败时按链切换备用**：如 `cobalt → parsehub → yt-dlp`，多一层保障
3. **通用解析作为兜底**：yt-dlp / cobalt / gallery-dl / parsehub 覆盖极广
4. **组合部署**：建议将主用+备用+通用同时部署，通过路由层自动切换
5. **parsehub 是国内平台的强力补充**：统一封装抖音/小红书/微博/贴吧/B站，异步高性能

## 免责声明

本仓库仅收录开源项目代码，供学习研究使用。使用者需遵守各平台服务条款及相关法律法规，不得用于侵犯版权或其他非法用途。各项目版权归原作者所有。

## 收录日期

2026-08-24（v2 复盘增补：新增 parsehub / doubao-nomark / instaloader / pixivpy-async / FxEmbed / Tieba-API-SCF）
