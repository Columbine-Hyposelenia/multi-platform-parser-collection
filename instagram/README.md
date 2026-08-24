# Instagram 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 免登录（公开帖子） |
| **需登录方案** | instaloader | [`../login-required/instaloader/`](../login-required/instaloader/) | 需登录（Session） |

## 主用：cobalt（免登录）

- **技术栈**: Node.js
- **覆盖媒体**: Instagram 视频、图片、轮播（Carousel）
- **质量**: 无水印，获取公开帖子的原图和视频
- **网页部署**: 纯 API 后端，Docker 部署，无需登录
- **特点**: 免登录即可解析公开帖子，API 优先，返回直链

## 需登录方案：instaloader

> Instagram 平台反爬日益严格，完整功能（Stories、Highlights、Reels、私密账号）需登录态。
> 本项目归入 `login-required/`，与免登录方案严格分离。

- **Stars**: 13,200+ | **技术栈**: Python
- **覆盖媒体**: 帖子图片/视频/轮播、Stories、Highlights、Reels、IGTV、个人资料、标签、地点
- **质量**: Instagram 原图和原始视频，无压缩
- **登录方式**: Session 文件 / 账号密码 / 2FA
- **网页部署**: Python 库嵌入后端，封装为 API
- **适用场景**: 需要 Stories/Highlights/Reels 完整下载，或 cobalt 免登录方案被限流时

## 通用兜底

`gallery-dl`（Instagram 图片批量下载，见 `../universal/`）→ `parsehub`（Instagram 视频+图文）

## 注意事项

- Instagram 反爬较强，频繁请求可能被限流
- 公开帖子免登录可用 cobalt，私密内容必须登录
- Stories 和 Highlights 有时效性，需及时下载
