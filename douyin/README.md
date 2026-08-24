# 抖音 Douyin 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | Douyin_TikTok_Download_API | [`./Douyin_TikTok_Download_API/`](./Douyin_TikTok_Download_API/) | 异步 FastAPI，抖音+TikTok，视频/图集无水印 |
| **备用专用解析** | parse-video-py | [`./parse-video-py/`](./parse-video-py/) | Python 多平台解析，支持抖音视频+图集 |
| **通用兜底** | yt-dlp / cobalt / parse-video / media-parser | [`../universal/`](../universal/) | 跨平台通用解析 |

## 主用项目：Douyin_TikTok_Download_API

- **原作者**: Evil0ctal
- **技术栈**: Python + FastAPI + HTTPX + PyWebIO
- **特点**:
  - 高性能异步抖音/TikTok 数据爬取
  - 支持 API 调用、在线批量解析及下载
  - 同时支持抖音和 TikTok（国际版）
  - 支持视频和图集（图文）解析
  - 提取作者、标题、封面、无水印视频地址、音乐
  - 可直接作为 Python 库（scraper.py）嵌入项目
  - Docker 一键部署
- **质量**: 直接解析抖音 API 获取无水印原始视频地址，支持最高画质

## 备用项目：parse-video-py

- **原作者**: wujunwei928
- **技术栈**: Python
- **特点**:
  - 支持抖音、皮皮虾、火山、微视、最右、快手、全民小视频、西瓜视频等
  - 支持抖音图集解析
  - 提供 Docker 部署
  - 支持 B站解析
- **适用场景**: 主用项目接口变更时的备用，或需要更多国内平台覆盖时

## 通用兜底

- **yt-dlp**: 支持抖音视频解析
- **cobalt**: 支持抖音/TikTok 无水印下载
- **parse-video** (Go版): 高性能国内多平台解析
- **media-parser**: 26 平台 RESTful API，支持抖音 Live 实况
