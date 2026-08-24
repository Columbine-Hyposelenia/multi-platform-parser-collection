# 多平台无水印解析开源项目合集

> 面向网页集成的多平台媒体解析项目库。所有项目均经过终审，满足：**无水印、最高质量、长期稳定、可部署为后端服务/API**。

## 终审标准

每个入库项目必须同时满足：
1. **无水印** — 解析结果不带平台水印
2. **最高质量** — 返回原始文件或平台可提供的最高质量版本
3. **长期稳定** — 维护活跃，接口可靠，注意时效性
4. **网页友好** — 提供 HTTP API / 可作为后端服务部署 / 可嵌入网页应用

## 仓库结构

```
.
├── universal/          # 通用解析（跨平台兜底）
├── douyin/             # 抖音
├── tiktok/             # TikTok（国际版）
├── bilibili/           # B站
├── xiaohongshu/        # 小红书
├── kuaishou/           # 快手
├── weibo/              # 微博
├── tieba/              # 百度贴吧
├── doubao/             # 豆包
├── youtube/            # YouTube
├── x-twitter/          # X / Twitter
├── instagram/          # Instagram
├── pixiv/              # Pixiv
├── reddit/             # Reddit
├── other/              # 其他平台工具
└── login-required/     # 需登录方案（与免登录方案严格分离）
```

## 平台速查表（终审版）

> 每个重点平台：**唯一主专用解析** + **一个最高优先级备用** + 补足（如有）+ 需登录方案（如有）

| 平台 | 主专用解析（免登录） | 备用专用解析（免登录） | 补足 | 需登录方案 |
|------|---------------------|----------------------|------|-----------|
| **抖音** | Douyin_TikTok_Download_API | parsehub | — | — |
| **TikTok** | Douyin_TikTok_Download_API | cobalt | — | — |
| **B站** | bilibili-parser | yt-dlp | BBDownT（8K/杜比/Hi-Res） | — |
| **小红书** | XHS-Downloader | rednote-api | — | — |
| **快手** | KS-Downloader | parsehub | — | — |
| **微博** | parsehub | watermark-remover-server | — | — |
| **百度贴吧** | Tieba-API-SCF | parsehub | — | — |
| **豆包** | doubao-nomark | — | — | — |
| **YouTube** | yt-dlp | cobalt | — | — |
| **X/Twitter** | cobalt | FxEmbed | — | — |
| **Instagram** | cobalt | — | — | instaloader |
| **Pixiv** | gallery-dl | — | — | pixivpy-async |
| **Reddit** | cobalt | gallery-dl | — | — |

## 通用解析项目（universal/）

| 项目 | 技术栈 | 覆盖范围 | 定位 |
|------|--------|---------|------|
| **yt-dlp** | Python | 1000+ 站点，YouTube/B站/抖音/TikTok/Twitter/SoundCloud/Twitch | 视频/音频通用最强 |
| **cobalt** | Node.js | YouTube/TikTok/X/Instagram/Reddit/SoundCloud/Pinterest/Twitch 等 20+ | API 优先，纯后端 |
| **gallery-dl** | Python | Pixiv/Twitter/Instagram/Reddit/Tumblr/Pinterest 等 40+ 图站 | 图片/图集原图最强 |
| **parsehub** | Python(异步) | 抖音/TikTok/小红书/微博/贴吧/B站/Instagram/YouTube 等 | 国内+国外聚合，`pip install` |
| **parse-video** | Go | 抖音/快手/火山/微视/西瓜/AcFun 等 22+ 国内平台 | 国内平台高性能 |
| **media-parser** | Python | 26 平台，RESTful API，支持 Live 实况图 | 专为 Web/小程序后端设计 |

## 需登录方案（login-required/）

> 以下项目需登录态（Cookie/Token）才能达到最高质量或正常使用，与免登录方案严格分离。

| 项目 | 适用平台 | 登录方式 | 说明 |
|------|---------|---------|------|
| **instaloader** | Instagram | Session/账号密码 | Instagram 图片/视频/Stories/Reels 完整下载，13k+ stars |
| **pixivpy-async** | Pixiv | access_token/refresh_token | 异步 Pixiv API，作品/画师/搜索/排行完整调用 |

## 补足机制说明

当主专用解析在某类媒体上未达最高质量，但整体仍为最优时，不替换主用，而是补充针对弱项的补足项目：

- **B站**：主用 bilibili-parser（Web 免登录，最高 4K）→ 补足 BBDownT（8K/杜比视界/Hi-Res，需登录大会员）
- 补足项紧跟主用，标注"补足：媒体类型"，不另列主用，不与备用混放

## 登录方案处理原则

1. **优先免登录**：主用和备用均选自无需登录即可使用的项目
2. **需登录分离**：必须登录才能使用的项目归入 `login-required/`，不与免登录方案混放
3. **部分需登录**：免登录可用但登录后质量更高的项目（如 BBDownT 补足项），保留原位并明确标注登录条件
4. **最高质量优先**：需登录方案同样必须达到最高质量标准，否则不收录

## 剔除记录（终审）

| 项目 | 剔除原因 |
|------|---------|
| parse-video-py | 与 parsehub 功能重叠，parsehub 更活跃、覆盖更广、异步性能更优 |
| PixiC | 与 pixivpy-async 重叠，后者更标准（Mikubill 原作）、异步、API 更完整 |

## 使用说明

- 每个平台目录下的 `README.md` 详细说明主用/备用/补足的部署方式和 API 调用
- 通用项目在 `universal/README.md` 中说明
- 需登录项目在 `login-required/README.md` 中说明登录配置方式
- 所有代码已完整复刻，可直接从本仓库获取，无需回原项目地址
