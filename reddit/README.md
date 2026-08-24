# Reddit 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 免登录 |
| **备用专用解析** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 免登录 |

## 说明

Reddit 无专用独立解析项目，由通用解析器覆盖：

- **主用 cobalt**: 支持 Reddit GIF 和视频下载，纯 API，免登录
- **备用 gallery-dl**: 支持 Reddit 图片和图集批量下载，原图质量，免登录

Reddit 内容多为图片和短视频，上述两个通用工具组合可完全覆盖。

## 通用兜底

`yt-dlp`（Reddit 视频解析，见 `../universal/`）
