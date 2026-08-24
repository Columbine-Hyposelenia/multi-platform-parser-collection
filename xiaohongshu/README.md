# 小红书 Xiaohongshu / RedNote 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | XHS-Downloader | [`./XHS-Downloader/`](./XHS-Downloader/) | 图文/视频全格式，API 模式，Docker，无水印 |
| **备用专用解析** | rednote-api | [`./rednote-api/`](./rednote-api/) | Rust+Axum 高性能 API，高分辨率图+原始视频 |
| **通用兜底** | media-parser / parse-video / watermark-remover-server | [`../universal/media-parser/`](../universal/media-parser/) | 多平台通用 |

## 主用项目：XHS-Downloader

- **原作者**: JoeanAmier
- **技术栈**: Python + AIOHTTP
- **特点**:
  - 采集小红书图文/视频作品信息
  - 提取无水印图文/视频作品下载地址
  - 下载无水印图文/视频作品文件
  - 支持 API 调用模式（FastAPI）
  - Docker 容器化部署
  - 支持从浏览器读取 Cookie
  - 作品文件完整性处理机制
  - 支持命令行、图形界面、API 服务多种运行方式
- **质量**: 获取小红书无水印原图和原视频，支持最高可用质量

## 备用项目：rednote-api

- **技术栈**: Rust + Axum
- **特点**:
  - 逆向工程的小红书非官方 API
  - 提取高分辨率图片
  - 提取原始视频 URL（无水印）
  - 获取标题、关键词、描述、互动数据
  - 异步 Rust，性能极高
  - 完全开源
- **适用场景**: 需要高性能 API 服务，或主用项目更新不及时的备用

## 通用兜底

- **media-parser**: 26 平台 RESTful API，支持小红书 Live 实况图
- **parse-video** (Go/Python): 支持小红书图集解析
- **watermark-remover-server**: Node.js 多平台，支持小红书 Live 图片

## 注意事项

- 小红书部分内容需要 Cookie 登录态才能获取最高质量
- 匿名请求可能只能获取 720P 及以下质量
- 小红书 API 变更较频繁，建议保持项目更新
- 小红书特定 3D 图片格式需注意兼容性
