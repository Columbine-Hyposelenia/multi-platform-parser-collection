# 其他平台解析方案

本目录收录非重点平台的解析项目，以及多平台综合工具。

## 收录项目

### watermark-remover-server

- **技术栈**: Node.js
- **支持平台**: 抖音、小红书、微博、微信公众号、快手
- **特点**:
  - 统一 RESTful API 接口
  - 小红书支持 Live 图片提取
  - 图片去水印处理
  - 支持多种图片格式
- **API 端点**:
  - `POST /analyze/douyin` - 抖音解析
  - `POST /analyze/xiaohongshu` - 小红书解析
  - `POST /analyze/kuaishou` - 快手解析
  - `POST /analyze/weibo` - 微博解析

## 其他平台覆盖说明

| 平台 | 推荐方案 | 位置 |
|------|---------|------|
| 微博 Weibo | watermark-remover-server / media-parser / parse-video | 本目录 / universal |
| 百度贴吧 | yt-dlp / 通用爬虫 | universal/yt-dlp |
| 小黑盒 | 暂无专用开源项目，通用解析兜底 | universal |
| 豆包 | 内容平台属性特殊，暂无专用解析 | — |
| 千问 | 内容平台属性特殊，暂无专用解析 | — |
| 西瓜视频 | parse-video / yt-dlp | universal |
| 皮皮虾 | parse-video | universal/parse-video |
| 火山视频 | parse-video | universal/parse-video |
| 微视 | parse-video | universal/parse-video |
| AcFun | parse-video-py | douyin/parse-video-py |
| 好看视频 | parse-video-py | douyin/parse-video-py |
| 虎牙 | parse-video-py | douyin/parse-video-py |
| 梨视频 | parse-video-py | douyin/parse-video-py |
| 最右 | parse-video | universal/parse-video |
| 全民小视频 | parse-video | universal/parse-video |
| 皮皮搞笑 | parse-video | universal/parse-video |
| Instagram | cobalt / gallery-dl | universal |
| Facebook | cobalt / yt-dlp | universal |
| Reddit | cobalt / gallery-dl | universal |
| SoundCloud | cobalt / yt-dlp | universal |
| Vimeo | cobalt / yt-dlp | universal |
| Pinterest | cobalt / gallery-dl | universal |
| Tumblr | gallery-dl | universal/gallery-dl |
| Twitch | cobalt / yt-dlp | universal |
