# 抖音 Douyin 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | Douyin_TikTok_Download_API | [`./Douyin_TikTok_Download_API/`](./Douyin_TikTok_Download_API/) | 异步 FastAPI，抖音+TikTok，视频/图集无水印 |
| **备用专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析库，抖音视频+图文+日常 |
| **备用链** | parse-video-py | [`./parse-video-py/`](./parse-video-py/) | Python 多平台解析 |
| **通用兜底** | yt-dlp / cobalt / parse-video / media-parser | [`../universal/`](../universal/) | 跨平台通用 |

## 主用项目：Douyin_TikTok_Download_API

- **原作者**: Evil0ctal
- **技术栈**: Python + FastAPI + HTTPX
- **特点**:
  - 高性能异步抖音/TikTok 数据爬取
  - 支持视频和图集（图文）解析
  - 提取作者、标题、封面、无水印视频地址、音乐
  - 可直接作为 Python 库嵌入项目
  - Docker 一键部署
- **质量**: 直接解析抖音 API 获取无水印原始视频地址

## 备用项目：parsehub

- **技术栈**: Python (异步) | **PyPI**: parsehub
- **特点**:
  - 支持抖音视频+图文+日常解析
  - `pip install parsehub` 开箱即用
  - 异步高性能，统一封装多平台
- **适用场景**: 主用项目接口变更时备用，或需要统一多平台 SDK 时

## 通用兜底

- **yt-dlp**: 抖音视频解析
- **cobalt**: 抖音/TikTok 无水印下载
- **parse-video** (Go): 国内多平台高性能
- **media-parser**: 26 平台 RESTful API，支持 Live 实况
