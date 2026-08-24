# B站 Bilibili 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | bilibili-parser | [`./bilibili-parser/`](./bilibili-parser/) | Web 端解析，支持 4K/HDR/杜比，扫码登录 |
| **备用专用解析** | BBDownT | [`./BBDownT/`](./BBDownT/) | 社区维护版 BBDown，最高质量 8K/HDR/杜比视界 |
| **通用兜底** | yt-dlp / Douyin_TikTok_Download_API | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 通用解析 |

## 主用项目：bilibili-parser

- **技术栈**: Web 应用
- **特点**:
  - 网站扫码登录，VIP 权限检测，登录状态保持
  - 支持 4K、1080P60、1080P+、1080P、720P 等多画质（VIP 画质权限检查）
  - 视音完整下载、分离下载、仅音频、纯画面、封面
  - 支持 MP4/FLV 等格式
  - 支持番剧、课程、电影、纪录片等专业内容
- **网页部署**: 可直接部署为 Web 服务
- **质量**: 可获取 B站提供的最高质量流地址（需对应账号权限）

## 备用项目：BBDownT

- **技术栈**: .NET / C#
- **特点**:
  - BBDown 社区维护续作（原项目 nilaoda/BBDown 已归档）
  - 支持 8K 超高清、Hi-Res 音频、杜比视界
  - 支持 DASH、MP4、FLV 格式
  - 支持番剧、课程、电影、纪录片
  - 支持批量下载收藏夹和剧集
  - 支持多线程下载（aria2c）
- **网页部署**: 可通过后端封装为 API 服务调用
- **质量**: B站下载质量天花板，支持平台所有高级格式

## 通用兜底

- **yt-dlp**: 支持 B站视频解析，可获取多清晰度流
- **Douyin_TikTok_Download_API**: 支持 B站解析（该项目同时覆盖 B站）

## 注意事项

- B站 4K 及以上画质、杜比视界等需要大会员账号权限
- DASH 格式音视频分离，需 FFmpeg 合并
- 部分新番/课程可能有 DRM 保护，无法下载
