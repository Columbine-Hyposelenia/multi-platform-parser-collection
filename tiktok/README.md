# TikTok（国际版）解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | Douyin_TikTok_Download_API | [`../douyin/Douyin_TikTok_Download_API/`](../douyin/Douyin_TikTok_Download_API/) | 免登录（公开内容） |
| **备用专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 免登录 |

## 主用：Douyin_TikTok_Download_API

- **技术栈**: Python + FastAPI + HTTPX（异步）
- **覆盖媒体**: TikTok 视频、图集（图文）、音乐、封面
- **质量**: 无水印原始视频，幻灯片图片无水印下载
- **网页部署**: FastAPI HTTP API，Docker 部署，抖音+TikTok 混合提交

## 备用：cobalt

- **技术栈**: Node.js
- **覆盖媒体**: TikTok 视频（有水印/无水印可选）、幻灯片图片、完整原始音频
- **质量**: 无水印，原始音频提取
- **网页部署**: 纯 API 后端，Docker 部署，返回直链无缓存
- **适用场景**: 主用项目对 TikTok 区域限制或接口变更时备用

## 通用兜底

`yt-dlp` → `parsehub`（均在 `../universal/`）

## 注意事项

- TikTok 部分地区有区域限制，可能需要代理
- 公开作品免登录，私密作品无法解析
