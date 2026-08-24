# 其他平台工具

本目录收录非重点平台的解析项目，以及多平台综合工具。

## 收录项目

### watermark-remover-server

- **技术栈**: Node.js
- **定位**: 多平台无水印解析 RESTful API 服务
- **覆盖**: 抖音、小红书、快手、微博、微信公众号
- **质量**: 无水印
- **网页部署**: Node.js 后端，统一 API 接口，Docker 部署
- **当前角色**: 微博平台备用专用解析

## 其他小众平台覆盖

以下小众平台由 `universal/` 下的通用解析器覆盖，无需专用项目：

| 平台 | 覆盖项目 |
|------|---------|
| SoundCloud | cobalt / yt-dlp |
| Twitch | cobalt / yt-dlp |
| Pinterest | gallery-dl |
| Tumblr | gallery-dl |
| Vimeo | yt-dlp / cobalt |
| 千问 | 暂无专用项目（AI 生成内容平台，API 变动频繁） |
| 小黑盒 | 暂无稳定开源项目（游戏社区，解析需求低） |
