# 快手 Kuaishou 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | KS-Downloader | [`./KS-Downloader/`](./KS-Downloader/) | 免登录（公开内容） |
| **备用专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 免登录 |

## 主用：KS-Downloader

- **原作者**: JoeanAmier（XHS-Downloader 同作者）
- **技术栈**: Python + curl_cffi
- **覆盖媒体**: 无水印视频、图片、音乐、封面
- **质量**: curl_cffi 浏览器指纹模拟，获取无水印原始文件
- **网页部署**: 支持 API 模式（FastAPI，端口 5557），Docker 容器化部署
- **特点**: 自动跳过已下载作品，支持批量，"不允许下载"作品仍可解析

## 备用：parsehub

- **技术栈**: Python（异步）
- **覆盖媒体**: 快手视频+图文
- **质量**: 无水印，平台最高可用质量
- **网页部署**: 异步库嵌入后端，`pip install parsehub`
- **适用场景**: 主用项目因快手 API 变更失效时备用

## 通用兜底

`Douyin_TikTok_Download_API`（同时支持快手，见 `../douyin/`）→ `parse-video` → `media-parser` → `yt-dlp`

## 注意事项

- 公开作品免登录，部分私密作品需 Cookie
- 快手 API 变更可能导致失效，建议关注更新
