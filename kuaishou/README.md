# 快手 Kuaishou 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | KS-Downloader | [`./KS-Downloader/`](./KS-Downloader/) | 无水印视频/图片/音乐，API 模式，Docker |
| **备用专用解析** | Douyin_TikTok_Download_API | [`../douyin/Douyin_TikTok_Download_API/`](../douyin/Douyin_TikTok_Download_API/) | 同时支持快手解析 |
| **通用兜底** | parse-video / media-parser | [`../universal/`](../universal/) | 多平台通用 |

## 主用项目：KS-Downloader

- **原作者**: JoeanAmier（XHS-Downloader 同作者）
- **技术栈**: Python + curl_cffi
- **特点**:
  - 下载快手无水印视频文件
  - 下载快手无水印图片文件
  - 下载快手作品封面图片
  - 下载快手作品音乐文件
  - 自动跳过已下载作品
  - 作品文件完整性处理机制
  - 支持 API 模式（FastAPI，端口 5557）
  - Docker 容器化部署
- **质量**: 基于 curl_cffi 浏览器指纹模拟，获取快手无水印原始文件

## 备用项目：Douyin_TikTok_Download_API

- 该项目同时覆盖快手平台解析
- 当 KS-Downloader 因 API 变更失效时可作为备用
- 提供 FastAPI 接口，部署方式一致

## 通用兜底

- **parse-video** (Go/Python): 支持快手视频和图集解析
- **media-parser**: 26 平台 RESTful API，包含快手

## 注意事项

- 快手部分作品设置为"不允许下载"，KS-Downloader 仍可解析
- 快手 API 变更可能导致解析失效，建议关注项目更新
- 建议使用 API 模式部署，便于前端对接
