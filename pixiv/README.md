# Pixiv 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 图片解析最强，支持 Pixiv 原图/动图/画师批量 |
| **备用专用解析** | PixiC | [`./PixiC/`](./PixiC/) | Pixiv 专用，关注画师/收藏下载，提供 API |
| **通用兜底** | — | — | gallery-dl 已足够覆盖 |

## 主用项目：gallery-dl

- **技术栈**: Python
- **Stars**: 19,000+
- **特点**:
  - Pixiv 插画/漫画原图下载
  - 支持动图（ugoira）转换为 zip 或 webm
  - 支持按画师、收藏、标签、排行榜批量下载
  - 支持 Pixiv Fanbox
  - 可配置 OAuth 认证获取更高权限
  - 作为 Python 库可嵌入后端服务
- **质量**: 直接获取 Pixiv 原始图片 URL，无压缩

## 备用项目：PixiC

- **原作者**: Coder-Sakura
- **技术栈**: Python
- **特点**:
  - Pixiv 插画批量下载
  - 支持关注画师插画下载
  - 支持收藏作品下载（单/多/动图）
  - 提供 API 接口
  - 多线程下载
- **适用场景**: 需要 Pixiv 专用功能（关注列表同步等），或 gallery-dl 失效时备用

## 注意事项

- Pixiv 需要登录 Token 才能访问完整内容
- R18 内容需要账号设置对应权限
- 动图（ugoira）为帧序列，需转换为视频格式
