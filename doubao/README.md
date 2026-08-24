# 豆包 Doubao 解析方案

## 平台分类

| 角色 | 项目名称 | 目录位置 | 说明 |
|------|---------|---------|------|
| **主专用解析** | doubao-nomark（无印豆包） | [`./doubao-nomark/`](./doubao-nomark/) | 豆包 AI 图片/视频无水印解析，Python 后端 API + Web UI |

## 主用项目：doubao-nomark（无印豆包）

- **原作者**: ihmily
- **技术栈**: Python + FastAPI + 浏览器扩展
- **特点**:
  - 一键下载豆包 AI 生成的无水印图片/视频
  - 提供 Python 后端 API 服务（异步调用）
  - 提供 Web 用户界面
  - 提供客户端浏览器扩展（Chrome/Edge）
  - 解析豆包分享链接，提取原始无水印资源
  - 图片分辨率高达 2048×2048，保留完整画质
  - 支持批量提取
- **API 调用示例**:
  ```python
  from doubao_parser.image import doubao_image_parse
  result = await doubao_image_parse(
      url="https://www.doubao.com/thread/xxxxxx",
      return_raw=False
  )
  ```
- **网页部署**: FastAPI 后端可直接部署，提供 HTTP 接口
- **质量**: 获取豆包 API 响应中的原始无水印 URL，非截图、非二次压缩

## 注意事项

- 豆包平台 API 可能随版本更新变化，建议保持项目最新
- 部分内容可能需要登录态 Cookie
- 本项目同时包含浏览器扩展和后端 API，网页环境优先使用后端 API 模式
