# 微博 Weibo 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 免登录（公开内容） |
| **备用专用解析** | watermark-remover-server | [`../other/watermark-remover-server/`](../other/watermark-remover-server/) | 免登录 |

## 主用：parsehub

- **技术栈**: Python（异步）| **PyPI**: parsehub
- **覆盖媒体**: 微博视频、图文（多图）
- **质量**: 无水印，获取微博原图和视频最高可用质量
- **网页部署**: 异步库直接嵌入 FastAPI/后端，`pip install parsehub`
- **特点**: 统一封装国内+国外多平台，微博为其重点支持平台

## 备用：watermark-remover-server

- **技术栈**: Node.js
- **覆盖媒体**: 微博视频、图片
- **质量**: 无水印
- **网页部署**: 统一 RESTful API，`POST /analyze/weibo` 端点，Docker 部署
- **适用场景**: 需要 Node.js 技术栈或统一 API 网关时；parsehub 失效时备用

## 通用兜底

`gallery-dl`（微博图片原图）→ `parse-video`（微博图集）（均在 `../universal/`）

## 注意事项

- 公开微博免登录，部分内容需 Cookie 登录态获取完整数据
- 微博视频有多种清晰度，优先获取最高可用版本
- 微博图片有防盗链，下载时需携带正确 Referer
