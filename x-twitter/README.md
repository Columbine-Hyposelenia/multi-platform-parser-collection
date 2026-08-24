# X / Twitter 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | cobalt | [`../universal/cobalt/`](../universal/cobalt/) | 支持 X/Twitter 视频和多图，可选择保存内容 |
| **备用专用解析** | gallery-dl | [`../universal/gallery-dl/`](../universal/gallery-dl/) | 图片解析强项，支持 Twitter 原图批量下载 |
| **通用兜底** | yt-dlp | [`../universal/yt-dlp/`](../universal/yt-dlp/) | 支持 Twitter 视频下载 |

## 主用项目：cobalt

- **技术栈**: Node.js
- **特点**:
  - 支持 X/Twitter 视频、GIF、多图推文
  - 多媒体推文可选择下载指定内容
  - 无需 API Key，无需登录
  - 纯 API 后端，Docker 部署
- **质量**: 获取平台提供的最高质量视频和原始图片

## 备用项目：gallery-dl

- **技术栈**: Python
- **Stars**: 19,000+
- **特点**:
  - Twitter/X 图片下载的最佳工具
  - 支持多图推文、原图质量
  - 支持用户时间线、收藏、列表批量下载
  - 可配置 OAuth 认证获取更高权限
- **适用场景**: 以图片为主的推文解析，或 cobalt 视频解析失败时的图片备用

## 通用兜底：yt-dlp

- 支持 Twitter 视频解析，作为最终兜底

## 注意事项

- X/Twitter 平台政策变化频繁，解析工具可能间歇性失效
- 部分推文可能需要登录态/Cookie 才能访问
- 建议同时部署 cobalt + gallery-dl，视频走 cobalt，图片走 gallery-dl
