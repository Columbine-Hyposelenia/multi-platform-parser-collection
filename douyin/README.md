# 抖音 Douyin 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | Douyin_TikTok_Download_API | [`./Douyin_TikTok_Download_API/`](./Douyin_TikTok_Download_API/) | 免登录（公开内容） |
| **备用专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 免登录 |

## 主用：Douyin_TikTok_Download_API

- **原作者**: Evil0ctal
- **技术栈**: Python + FastAPI + HTTPX（异步）
- **覆盖媒体**: 视频、图集（图文）、音乐、封面、作者信息
- **质量**: 直接解析抖音 API 获取无水印原始视频地址
- **网页部署**: FastAPI 原生 HTTP API，Docker 一键部署，可直接嵌入网页后端
- **稳定性**: 持续维护，社区活跃，抖音+TikTok 双平台统一接口

## 备用：parsehub

- **技术栈**: Python（异步）| **PyPI**: parsehub
- **覆盖媒体**: 抖音视频+图文+日常
- **质量**: 无水印，获取平台最高可用质量
- **网页部署**: 异步库直接嵌入 FastAPI/后端，`pip install parsehub`
- **适用场景**: 主用项目因抖音 API 变更临时失效时的第一备用

## 通用兜底

主用和备用均失效时：`cobalt` → `yt-dlp` → `parse-video` → `media-parser`（均在 `../universal/`）

## 注意事项

- 公开作品免登录即可解析，私密/好友可见作品需 Cookie
- 抖音 API 变更频繁，建议保持最新版本
