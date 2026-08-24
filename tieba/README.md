# 百度贴吧 Tieba 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | Tieba-API-SCF | [`./Tieba-API-SCF/`](./Tieba-API-SCF/) | HTTP API 服务，基于 Hono + tieba.js |
| **备用专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析库，支持贴吧视频+图文 |
| **通用兜底** | — | — | — |

## 主用项目：Tieba-API-SCF

- **技术栈**: TypeScript / Hono / tieba.js
- **特点**:
  - 面向贴吧数据查询与分析的 HTTP API 服务
  - 将贴吧原始接口（协议复杂、字段分散）统一为标准 HTTP 接口
  - 全部 GET 请求，方便接入前端、脚本、数据分析
  - 支持帖子内容、图片、视频提取
  - 可部署在 Cloudflare Workers / Vercel / 自建服务器
- **质量**: 获取贴吧原图和视频地址

## 备用项目：parsehub

- **技术栈**: Python (异步)
- **特点**:
  - 支持贴吧视频+图文解析
  - `pip install parsehub` 开箱即用
  - 异步高性能
- **适用场景**: Python 技术栈、需要与其他国内平台统一解析时

## 注意事项

- 贴吧部分帖子内容需要登录态（Cookie/BDUSS）才能访问
- 贴吧图片有防盗链，下载时需携带正确 Referer
