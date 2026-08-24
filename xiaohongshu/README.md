# 小红书 Xiaohongshu / RedNote 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | XHS-Downloader | [`./XHS-Downloader/`](./XHS-Downloader/) | 免登录（720P）/ Cookie（最高质量） |
| **备用专用解析** | rednote-api | [`./rednote-api/`](./rednote-api/) | 免登录（公开内容） |

## 主用：XHS-Downloader

- **原作者**: JoeanAmier
- **技术栈**: Python + AIOHTTP（异步）
- **覆盖媒体**: 图文笔记（多图）、视频、Live 实况图、封面、音乐
- **质量**: 无水印原图和原视频；匿名请求 720P 及以下，配置 Cookie 后获取最高质量
- **网页部署**: 支持 API 模式（FastAPI），Docker 容器化部署，可直接嵌入网页后端
- **特点**: 从浏览器读取 Cookie，作品文件完整性处理，支持批量下载

## 备用：rednote-api

- **技术栈**: Rust + Axum
- **覆盖媒体**: 高分辨率图片、原始视频（无水印）
- **质量**: 无水印，提取高分辨率图和原始视频 URL
- **网页部署**: Rust 异步 HTTP API，性能极高，Docker 部署
- **适用场景**: 需要高性能 API 服务或主用项目因依赖问题时备用

## 通用兜底

`parsehub` → `media-parser` → `gallery-dl` → `parse-video`（均在 `../universal/`）

## 注意事项

- 最高质量（1080P+ 视频、原图）需 Cookie 登录态
- 小红书 API 变更频繁，建议保持更新
- 3D 图片格式需注意前端兼容性
