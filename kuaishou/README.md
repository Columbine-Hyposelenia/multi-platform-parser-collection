# 快手 Kuaishou 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | KS-Downloader | [`./KS-Downloader/`](./KS-Downloader/) | 无水印视频/图片/音乐，API 模式，Docker |
| **备用专用解析** | parsehub | [`../universal/parsehub/`](../universal/parsehub/) | 异步聚合解析库 |
| **备用链** | Douyin_TikTok_Download_API | [`../douyin/Douyin_TikTok_Download_API/`](../douyin/Douyin_TikTok_Download_API/) | 同时支持快手 |
| **通用兜底** | parse-video / media-parser / yt-dlp | [`../universal/`](../universal/) | 多平台通用 |

## 主用项目：KS-Downloader

- **原作者**: JoeanAmier（XHS-Downloader 同作者）
- **技术栈**: Python + curl_cffi
- **特点**:
  - 下载快手无水印视频/图片/音乐/封面
  - 自动跳过已下载作品
  - 支持 API 模式（FastAPI，端口 5557）
  - Docker 容器化部署
- **质量**: curl_cffi 浏览器指纹模拟，获取无水印原始文件

## 备用项目：parsehub

- 支持快手解析（通过统一聚合接口）
- 异步 Python，`pip install parsehub`

## 备用链：Douyin_TikTok_Download_API

- 该项目同时覆盖快手平台
- FastAPI 接口，部署方式一致

## 注意事项

- 部分作品设为"不允许下载"，KS-Downloader 仍可解析
- 快手 API 变更可能导致失效，建议关注更新
