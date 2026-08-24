# TikTok（国际版）解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | Douyin_TikTok_Download_API | [`../douyin/Douyin_TikTok_Download_API/`](../douyin/Douyin_TikTok_Download_API/) | 同时支持抖音和 TikTok，异步 FastAPI，无水印视频/图集 |
| **备用专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | API 优先，支持 TikTok 无水印视频/幻灯片图片/原始音频 |
| **通用兜底** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 通用解析，支持 TikTok 视频下载 |

## 主用项目：Douyin_TikTok_Download_API

- **技术栈**: Python + FastAPI + HTTPX + PyWebIO
- **特点**:
  - 开箱即用的高性能异步抖音/TikTok 数据爬取工具
  - 支持 API 调用、在线批量解析及下载
  - 网页端批量解析（支持抖音/TikTok 混合提交）
  - 支持 iOS 快捷指令无水印下载
  - 可直接调用 scraper.py 作为解析库
- **部署**: Docker 一键部署 / 私有服务器部署
- **质量**: 获取无水印原始视频地址，支持图集解析

## 备用项目：cobalt

- **技术栈**: Node.js
- **特点**:
  - 支持 TikTok 视频（有水印/无水印可选）
  - 支持幻灯片图片无水印下载
  - 支持完整原始音频提取
  - 纯 API 后端，Docker 部署
- **适用场景**: 主用项目接口变更或失效时的备用方案

## 通用兜底：yt-dlp

- 支持 TikTok 视频解析，作为最终兜底方案
