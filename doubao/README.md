# 豆包 Doubao 解析方案

## 平台分类（终审版）

| 角色 | 项目名称 | 目录位置 | 登录要求 |
|------|---------|---------|---------|
| **主专用解析** | doubao-nomark（无印豆包） | [`./doubao-nomark/`](./doubao-nomark/) | 免登录（分享链接） |

## 主用：doubao-nomark（无印豆包）

- **原作者**: ihmily
- **技术栈**: Python + FastAPI（异步）+ 浏览器扩展
- **覆盖媒体**: 豆包 AI 生成的图片、视频
- **质量**: 获取豆包 API 响应中的原始无水印 URL，非截图、非二次压缩，图片分辨率高达 2048×2048
- **网页部署**: FastAPI 后端可直接部署，提供 HTTP 接口；同时提供 Web UI 和浏览器扩展
- **API 示例**:
  ```python
  from doubao_parser.image import doubao_image_parse
  result = await doubao_image_parse(
      url="https://www.doubao.com/thread/xxxxxx",
      return_raw=False
  )
  ```
- **特点**: 支持批量提取，异步调用高性能

## 注意事项

- 豆包分享链接免登录即可解析
- 豆包平台 API 可能随版本更新变化，建议保持项目最新
- 网页环境优先使用后端 API 模式，浏览器扩展为辅助工具
