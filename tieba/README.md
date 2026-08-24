# 百度贴吧 Tieba 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | Tieba-API-SCF | [`./Tieba-API-SCF/`](./Tieba-API-SCF/) | 免登录（公开帖子） |
| **备用专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 免登录 |

## 主用：Tieba-API-SCF

- **技术栈**: TypeScript / Hono / tieba.js
- **覆盖媒体**: 帖子内容、图片、视频
- **质量**: 获取贴吧原图和视频地址，无水印
- **网页部署**: 原生 HTTP API 服务，全部 GET 请求，可部署 Cloudflare Workers/Vercel/自建
- **特点**: 将贴吧原始接口（协议复杂、字段分散）统一为标准 HTTP 接口，方便前端接入

## 备用：parsehub

- **技术栈**: Python（异步）
- **覆盖媒体**: 贴吧视频+图文
- **质量**: 无水印
- **网页部署**: 异步库嵌入后端，`pip install parsehub`
- **适用场景**: Python 技术栈、需与其他国内平台统一解析时

## 注意事项

- 公开帖子免登录，部分帖子需登录态（Cookie/BDUSS）
- 贴吧图片有防盗链，下载需正确 Referer
