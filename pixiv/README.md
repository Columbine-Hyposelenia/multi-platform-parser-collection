# Pixiv 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 图片解析最强，原图/动图/画师批量 |
| **备用专用解析** | pixivpy-async | [`./pixivpy-async/`](./pixivpy-async/) | 异步 Pixiv API 库，纯 Python |
| **备用链** | PixiC | [`./PixiC/`](./PixiC/) | Pixiv 专用批量下载+API |
| **通用兜底** | — | — | gallery-dl 已足够覆盖 |

## 主用项目：gallery-dl

- **Stars**: 19,000+ | **语言**: Python
- **特点**:
  - Pixiv 插画/漫画原图下载
  - 动图（ugoira）转换为 zip 或 webm
  - 按画师、收藏、标签、排行榜批量下载
  - 支持 Pixiv Fanbox
  - OAuth 认证获取更高权限
- **质量**: 直接获取 Pixiv 原始图片 URL，无压缩

## 备用项目：pixivpy-async

- **原作者**: Mikubill | **Stars**: 160+
- **技术栈**: Python (asyncio)
- **特点**:
  - 纯 Python 3 异步 Pixiv API
  - 支持作品详情、画师信息、搜索、排行、收藏
  - 可获取原图 URL 后自行下载
  - 轻量级，适合嵌入异步后端
- **适用场景**: 需要精细控制 API 调用、异步后端集成时

## 备用链：PixiC

- **技术栈**: Python
- **特点**:
  - Pixiv 插画批量下载
  - 关注画师、收藏作品下载（单/多/动图）
  - 提供 API 接口，多线程下载

## 注意事项

- Pixiv 需登录 Token 访问完整内容
- R18 内容需账号设置对应权限
- 动图（ugoira）为帧序列，需转换为视频
- 主用 gallery-dl 直接下载，备用 pixivpy-async 做 API 层灵活调用
