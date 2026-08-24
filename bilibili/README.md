# B站 Bilibili 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | BBDownT | [`./BBDownT/`](./BBDownT/) | 最高质量下载器，支持 8K/HDR/杜比视界，社区维护续作 |
| **备用专用解析** | bilibili-parser | [`./bilibili-parser/`](./bilibili-parser/) | Web 端免登录解析，支持 4K/HDR，扫码登录 |
| **通用兜底** | yt-dlp / parsehub / cobalt | [`../universal/`](../universal/) | 跨平台通用解析 |

## 主用项目：BBDownT

- **技术栈**: .NET / C#
- **特点**:
  - BBDown 社区维护续作（原项目 nilaoda/BBDown 已归档）
  - **最高质量天花板**：支持 8K 超高清、Hi-Res 音频、杜比视界、HDR
  - 支持 DASH、MP4、FLV 格式
  - 支持番剧、课程、电影、纪录片、合集、分P、互动视频
  - 支持批量下载收藏夹和剧集
  - 支持多线程下载（aria2c）
- **网页部署**: 可通过后端封装为 API 服务调用（CLI → HTTP 包装）
- **质量**: B站下载质量天花板，支持平台所有高级格式

## 备用项目：bilibili-parser

- **技术栈**: Web 应用
- **特点**:
  - 扫码登录，VIP 权限检测
  - 支持 4K、1080P60 等多画质
  - 视音完整/分离下载、仅音频、封面
  - **免登录可解析基础画质**
- **网页部署**: 直接部署为 Web 服务，前端友好
- **适用场景**: 需要 Web 界面或 .NET 环境不便部署时

## 通用兜底

- **yt-dlp**: B站视频解析，多清晰度
- **parsehub**: B站视频+动态，异步 Python 库
- **cobalt**: B站视频下载

## 注意事项

- 4K+/杜比视界需大会员权限
- DASH 音视频分离需 FFmpeg 合并
- BBDownT 为 CLI，生产环境建议封装 HTTP API
