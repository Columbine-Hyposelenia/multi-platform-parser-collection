# TikTok（国际版）解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | Douyin_TikTok_Download_API | [`../douyin/Douyin_TikTok_Download_API/`](../douyin/Douyin_TikTok_Download_API/) | 同时支持抖音和 TikTok，异步 FastAPI |
| **备用专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | API 优先，TikTok 无水印视频/幻灯片/原始音频 |
| **备用链** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析，TikTok 视频+图文 |
| **通用兜底** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 通用解析 |

## 主用项目：Douyin_TikTok_Download_API

- **技术栈**: Python + FastAPI + HTTPX
- **特点**:
  - 开箱即用的高性能异步抖音/TikTok 工具
  - 支持 API 调用、在线批量解析及下载
  - 支持抖音/TikTok 混合提交
  - 支持视频和图集解析
  - Docker 部署
- **质量**: 获取无水印原始视频地址

## 备用项目：cobalt

- **技术栈**: Node.js
- **特点**:
  - TikTok 视频（有水印/无水印可选）
  - 幻灯片图片无水印下载
  - 完整原始音频提取
  - 纯 API 后端，Docker 部署

## 备用链：parsehub

- 支持 TikTok 视频+图文
- 异步 Python 库

## 通用兜底：yt-dlp

- 支持 TikTok 视频解析
