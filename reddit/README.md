# Reddit 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 支持 Reddit GIF 和视频 |
| **备用专用解析** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | Reddit 图片/图集批量下载 |
| **通用兜底** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | Reddit 视频解析 |

## 说明

Reddit 无专用独立解析项目，由通用解析器覆盖：

- **cobalt**: 支持 Reddit GIF 和视频下载，纯 API
- **gallery-dl**: 支持 Reddit 图片和图集批量下载，原图质量
- **yt-dlp**: 支持 Reddit 视频解析

Reddit 内容多为图片和短视频，上述三个通用工具组合可完全覆盖。
