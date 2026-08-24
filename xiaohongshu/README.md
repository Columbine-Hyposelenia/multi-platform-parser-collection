# 小红书 Xiaohongshu / RedNote 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | XHS-Downloader | [`./XHS-Downloader/`](./XHS-Downloader/) | 图文/视频全格式，API 模式，Docker，无水印 |
| **备用专用解析** | rednote-api | [`./rednote-api/`](./rednote-api/) | Rust+Axum 高性能 API，高分辨率图+原始视频 |
| **备用链** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析，小红书视频+图文 |
| **通用兜底** | media-parser / parse-video / gallery-dl / watermark-remover-server | [`../universal/`](../universal/) | 多平台通用 |

## 主用项目：XHS-Downloader

- **原作者**: JoeanAmier
- **技术栈**: Python + AIOHTTP
- **特点**:
  - 采集小红书图文/视频作品信息
  - 提取无水印图文/视频下载地址
  - 支持 API 模式（FastAPI）
  - Docker 容器化部署
  - 支持从浏览器读取 Cookie
  - 作品文件完整性处理机制
- **质量**: 获取小红书无水印原图和原视频

## 备用项目：rednote-api

- **技术栈**: Rust + Axum
- **特点**:
  - 高分辨率图片提取
  - 原始视频 URL（无水印）
  - 异步 Rust，性能极高
- **适用场景**: 需要高性能 API 服务时

## 备用链：parsehub

- 支持小红书视频+图文解析
- 异步 Python 库，可嵌入后端

## 注意事项

- 部分内容需 Cookie 登录态获取最高质量
- 匿名请求可能仅 720P 及以下
- 小红书 API 变更频繁，建议保持更新
- 3D 图片格式需注意兼容性
