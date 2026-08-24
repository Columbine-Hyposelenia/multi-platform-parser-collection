# X / Twitter 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 支持 X/Twitter 视频和多图，API 优先 |
| **备用专用解析** | FxEmbed (fxtwitter) | [`./FxEmbed/`](./FxEmbed/) | 嵌入修复，标准化 JSON，视频/图片/投票 |
| **备用链** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析，Twitter 视频+图文 |
| **通用兜底** | gallery-dl / yt-dlp | [`../universal/`](../universal/) | 图片/视频通用 |

## 主用项目：cobalt

- **技术栈**: Node.js
- **特点**:
  - 支持 X/Twitter 视频、GIF、多图推文
  - 多媒体推文可选择下载指定内容
  - 无需 API Key，无需登录
  - 纯 API 后端，Docker 部署

## 备用项目：FxEmbed（fxtwitter / fixupx）

- **技术栈**: TypeScript / Cloudflare Worker
- **特点**:
  - 修复 X/Twitter 链接嵌入（Discord/Telegram 等）
  - 支持多图、视频、投票、引用推文、翻译
  - 提供标准化 JSON over HTTP（帖子查询、线程展开、用户资料、搜索）
  - 自托管可选，也有公开实例（fxtwitter.com, fixupx.com）
  - 最佳隐私保护，无数据存储
- **适用场景**: 需要嵌入预览或标准化 JSON API 时；cobalt 失效时备用

## 备用链：parsehub

- 支持 Twitter 视频+图文解析
- 异步 Python 库，可嵌入后端

## 通用兜底

- **gallery-dl**: Twitter 原图批量下载最强
- **yt-dlp**: Twitter 视频解析

## 注意事项

- X/Twitter 政策变化频繁，建议多方案并行
- 部分推文需登录态/Cookie
- 视频走 cobalt/FxEmbed，图片走 gallery-dl，组合最优
