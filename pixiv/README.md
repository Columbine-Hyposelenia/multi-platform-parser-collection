# Pixiv 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 免登录（公开内容）/ OAuth（完整） |
| **需登录方案** | pixivpy-async | [`../login-required/pixivpy-async/`](../login-required/pixivpy-async/) | 需登录（access_token） |

## 主用：gallery-dl（免登录）

- **Stars**: 19,000+ | **技术栈**: Python
- **覆盖媒体**: 插画/漫画原图、动图（ugoira，转换为 zip 或 webm）
- **质量**: 直接获取 Pixiv 原始图片 URL，无压缩
- **网页部署**: Python 库嵌入后端，或 CLI 封装 API
- **特点**: 按画师、收藏、标签、排行榜批量下载，支持 Pixiv Fanbox
- **登录**: 免登录可下载公开内容，配置 OAuth refresh_token 后获取完整权限

## 需登录方案：pixivpy-async

> Pixiv 完整 API 调用需登录 token，本项目归入 `login-required/`，与免登录方案严格分离。

- **原作者**: Mikubill | **技术栈**: Python（asyncio）
- **覆盖媒体**: 作品详情、画师信息、搜索、排行、收藏、原图 URL
- **质量**: 通过 Pixiv API 获取原图地址，自行下载
- **登录方式**: access_token / refresh_token（需 Pixiv 账号）
- **网页部署**: 异步库嵌入 FastAPI 后端
- **适用场景**: 需要精细控制 API 调用、搜索/排行/收藏等高级功能时

## 注意事项

- Pixiv 需登录 Token 访问完整内容，R18 内容需账号设置对应权限
- 动图（ugoira）为帧序列，需转换为视频
- 主用 gallery-dl 直接下载，需登录方案 pixivpy-async 做 API 层灵活调用
