# X / Twitter 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 免登录（公开推文） |
| **备用专用解析** | FxEmbed（fxtwitter） | [`./FxEmbed/`](./FxEmbed/) | 免登录 |

## 主用：cobalt

- **技术栈**: Node.js
- **覆盖媒体**: X/Twitter 视频、GIF、多图推文
- **质量**: 无水印，多媒体推文可选择下载指定内容
- **网页部署**: 纯 API 后端，Docker 部署，无需 API Key，无需登录
- **特点**: 返回直链，无缓存，API 优先设计

## 备用：FxEmbed（fxtwitter / fixupx）

- **技术栈**: TypeScript / Cloudflare Worker
- **覆盖媒体**: 多图、视频、投票、引用推文、翻译
- **质量**: 标准化 JSON 输出，视频和图片直链
- **网页部署**: Cloudflare Worker 自托管，或使用公开实例（fxtwitter.com, fixupx.com）
- **特点**: 修复 X/Twitter 链接嵌入（Discord/Telegram 等），提供帖子查询/线程展开/用户资料/搜索 API
- **适用场景**: 需要嵌入预览或标准化 JSON API 时；cobalt 失效时备用

## 通用兜底

`gallery-dl`（Twitter 原图批量下载）→ `yt-dlp`（Twitter 视频）（均在 `../universal/`）

## 注意事项

- 公开推文免登录，部分内容需登录态/Cookie
- X/Twitter 政策变化频繁，建议多方案并行
- 视频走 cobalt/FxEmbed，图片走 gallery-dl，组合最优
