# Instagram 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | instaloader | [`./instaloader/`](./instaloader/) | 13k+ stars，Instagram 图片/视频/Stories/Reels 下载 |
| **备用专用解析** | cobalt → parsehub | [`../universal/cobalt/`](../universal/cobalt/) | 通用 API 下载器 |
| **通用兜底** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 图片通用解析 |

## 主用项目：instaloader

- **Stars**: 13,200+ | **语言**: Python | **协议**: MIT
- **特点**:
  - Instagram 下载的事实标准工具
  - 支持公开账号的帖子图片、视频、轮播(Carousel)
  - 支持 Stories、Highlights、Reels、IGTV
  - 支持个人资料、标签、地点批量下载
  - 可下载评论、字幕、元数据
  - 支持登录态获取私密账号内容（需有访问权限）
  - 可作为 Python 库嵌入后端，或 CLI 使用
- **网页部署**: 作为 Python 库嵌入 FastAPI/Django 后端，封装为 API
- **质量**: 获取 Instagram 原图和原始视频，无压缩

## 备用项目

- **cobalt**: 支持 Instagram 视频/图片下载，纯 API
- **parsehub**: 支持 Instagram 视频+图文，异步 Python 库
- **gallery-dl**: 支持 Instagram 图片批量下载

## 注意事项

- Instagram 反爬较强，频繁请求可能被限流
- 建议使用登录态（Session）提高稳定性
- Stories 和 Highlights 有时效性，需及时下载
- Reels 视频可能需要特定解析逻辑
