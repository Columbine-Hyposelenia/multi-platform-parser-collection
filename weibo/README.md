# 微博 Weibo 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析库，支持微博视频+图文 |
| **备用专用解析** | watermark-remover-server | [`../other/watermark-remover-server/`](../other/watermark-remover-server/) | Node.js 多平台，含微博专用解析器 |
| **通用兜底** | gallery-dl / parse-video | [`../universal/`](../universal/) | 图片/多平台通用 |

## 主用项目：parsehub

- **技术栈**: Python (异步) | **PyPI**: parsehub
- **特点**:
  - 支持微博视频+图文解析
  - 异步高性能，可直接嵌入 FastAPI 后端
  - `pip install parsehub` 开箱即用
  - 统一封装国内+国外多平台
- **质量**: 获取微博原图和无水印视频

## 备用项目：watermark-remover-server

- **技术栈**: Node.js
- **特点**:
  - 统一 RESTful API 接口
  - `POST /analyze/weibo` 微博解析端点
  - 支持微博视频和图片
  - 同时支持抖音、小红书、快手、微信公众号
- **适用场景**: 需要 Node.js 技术栈或统一 API 网关时

## 通用兜底

- **gallery-dl**: 支持微博图片原图下载
- **parse-video** (Go/Python): 支持微博图集解析

## 注意事项

- 微博部分内容需要登录 Cookie 才能获取完整数据
- 微博视频有多种清晰度，建议优先获取最高可用版本
