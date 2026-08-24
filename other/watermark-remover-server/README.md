# 社交媒体内容解析服务

一个基于 Node.js 的社交媒体内容解析服务，支持解析抖音、小红书、快手、微博、微信公众号等平台的视频和图片内容。

## 目录

- [项目特性](#项目特性)
- [技术栈](#技术栈)
- [安装与运行](#安装与运行)
- [API 接口文档](#api-接口文档)
  - [通用解析接口](#通用解析接口)
  - [平台专用接口](#平台专用接口)
  - [文件代理接口](#文件代理接口)
- [解析器详解](#解析器详解)
  - [抖音解析器](#抖音解析器)
  - [小红书解析器](#小红书解析器)
  - [快手解析器](#快手解析器)
  - [微博解析器](#微博解析器)
  - [微信公众号解析器](#微信公众号解析器)
- [反爬虫策略](#反爬虫策略)
- [部署说明](#部署说明)

## 项目特性

- ✅ 支持多平台内容解析（抖音、小红书、快手、微博、微信公众号）
- ✅ 自动提取无水印视频和高清图片
- ✅ 智能识别平台类型
- ✅ 支持多画质视频获取（抖音支持 1080p）
- ✅ 随机请求头生成，有效对抗反爬虫
- ✅ 支持文件流代理，解决跨域问题
- ✅ 错误重试机制
- ✅ 支持 Docker 容器化部署

## 技术栈

- **运行环境**: Node.js >= 18.0.0
- **Web 框架**: Express.js
- **HTTP 客户端**: Axios
- **HTML 解析**: Cheerio
- **随机数据生成**: @faker-js/faker
- **User-Agent 生成**: user-agents
- **日志**: Morgan
- **跨域**: CORS

## 安装与运行

### 本地开发

```bash
# 克隆项目
git clone <repository-url>
cd wxcloudrun-express

# 安装依赖
npm install

# 启动服务（默认端口 80）
npm start
```

### Docker 部署

```bash
# 构建镜像
docker build -t social-media-parser .

# 运行容器
docker run -p 80:80 social-media-parser
```

## API 接口文档

### 通用解析接口

**接口地址**: `POST /analyze`

**请求参数**:
```json
{
  "url": "社交媒体分享链接",
  "type": "webp",  // 可选，图片格式：webp/jpg/png
  "format": "json" // 可选，返回格式：json/html
}
```

**返回示例**:
```json
{
  "code": 0,
  "message": "获取成功",
  "data": {
    "url": "原始链接",
    "final_url": "重定向后的最终链接",
    "title": "标题",
    "description": "描述/文案",
    "author": "作者",
    "publish_time": "发布时间",
    "image_list": ["图片URL数组"],
    "video": "视频URL（无水印）",
    "app_type": "平台类型",
    "live_list": ["Live图片数组（小红书专用）"]
  },
  "timestamp": "2025-01-19T06:15:00.000Z"
}
```

### 平台专用接口

每个平台都有专用的解析接口，参数和返回格式与通用接口相同：

- **小红书**: `POST /analyze/xiaohongshu`
- **抖音**: `POST /analyze/douyin`
- **快手**: `POST /analyze/kuaishou`
- **微博**: `POST /analyze/weibo`
- **微信公众号**: `POST /analyze/wechat`

### 文件代理接口

**接口地址**: `POST /system/get_file_stream`

用于代理下载受保护的资源，解决跨域和防盗链问题。

**请求参数**:
```json
{
  "url": "资源URL",
  "filename": "文件名（可选）"
}
```

## 解析器详解

### 抖音解析器

**文件位置**: `parsers/douyin.js`

**解析步骤**:

1. **URL 提取与请求**
   - 从输入文本中提取抖音短链接（支持 v.douyin.com 格式）
   - 使用随机生成的请求头访问链接
   - 处理重定向，获取最终的视频页面 URL

2. **数据提取**
   - 从页面 HTML 中查找 `window._ROUTER_DATA` 数据
   - 支持多种数据结构：`note_(id)`、`video_(id)` 等
   - 提取视频、图片、描述等信息

3. **视频处理**
   - 提取 video_id（支持多种格式）
   - 使用抖音内部 API 获取无水印视频
   - API 端点：`https://aweme.snssdk.com/aweme/v1/play/`
   - 直接请求 1080p 画质，API 会自动返回最佳可用画质

4. **特殊功能**
   - 自动识别视频/图集类型
   - 支持获取高清无水印视频
   - 视频链接可直接下载，无需代理

**关键代码**:
```javascript
// 获取无水印视频
const playUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoPlayId}&ratio=1080p&line=0`;
```

### 小红书解析器

**文件位置**: `parsers/xiaohongshu.js`

**解析步骤**:

1. **页面获取**
   - 处理短链接重定向
   - 获取笔记详情页面

2. **数据提取**
   - 解析页面中的 JSON 数据
   - 提取图片、视频、文案信息
   - 支持 Live 图片提取

3. **资源处理**
   - 图片去水印处理
   - 支持多种图片格式

### 快手解析器

**文件位置**: `parsers/kuaishou.js`

**解析步骤**:

1. **链接处理**
   - 支持多种快手链接格式
   - 处理移动端和 PC 端链接

2. **数据提取**
   - 从页面脚本中提取视频信息
   - 获取作者、标题、描述等元数据

3. **视频处理**
   - 提取无水印视频链接
   - 处理不同清晰度的视频源

### 微博解析器

**文件位置**: `parsers/weibo.js`

**解析步骤**:

1. **页面访问**
   - 处理微博短链接（t.cn）
   - 适配移动端和 PC 端页面

2. **内容提取**
   - 解析微博正文
   - 提取图片和视频资源
   - 获取发布时间、作者信息

### 微信公众号解析器

**文件位置**: `parsers/wechat.js`

**解析步骤**:

1. **文章获取**
   - 访问公众号文章页面
   - 处理微信的访问限制

2. **内容提取**
   - 提取文章标题、作者、发布时间
   - 获取文章正文和图片
   - 保留原始格式

## 反爬虫策略

### 1. 随机请求头生成

使用 `utils/realisticHeaders.js` 生成真实的浏览器请求头：

```javascript
// 主要特性
- 随机 User-Agent（使用 user-agents 库）
- 随机 IP 地址（X-Forwarded-For）
- 随机 Cookie
- 平台特定的请求头
- 浏览器安全头部（Sec-CH-UA 等）
```

### 2. 请求重试机制

```javascript
// 使用 retry 函数进行智能重试
async function retry(fn, maxRetries = 3, delayMs = 1000)
```

### 3. 平台特定优化

- **抖音**: 使用移动端 User-Agent，添加平台特定标识
- **小红书**: 添加 X-Xhs-Common 等特殊请求头
- **微博**: 模拟 XMLHttpRequest 请求
- **快手**: 使用移动端访问策略

### 4. 代理 IP 模拟

通过 `X-Forwarded-For` 和 `X-Real-IP` 头部模拟不同的访问来源。

## 部署说明

### 环境变量

```bash
PORT=80  # 服务端口，默认 80
```

### 微信云托管部署

1. 配置 `container.config.json`：
```json
{
  "containerPort": 80,
  "minNum": 0,
  "maxNum": 5,
  "cpu": 1,
  "mem": 2,
  "policyType": "cpu",
  "policyThreshold": 80,
  "envParams": {},
  "customLogs": "stdout"
}
```

2. 构建并推送镜像到微信云托管

### 注意事项

1. **请求频率**: 建议添加请求频率限制，避免触发平台风控
2. **错误处理**: 所有解析器都有完善的错误处理机制
3. **日志记录**: 使用 Morgan 记录所有请求日志
4. **跨域设置**: 已配置 CORS，支持跨域请求

## 项目结构

```
wxcloudrun-express/
├── parsers/              # 各平台解析器
│   ├── index.js         # 解析器
│   ├── douyin.js        # 抖音解析器
│   ├── xiaohongshu.js   # 小红书解析器
│   ├── kuaishou.js      # 快手解析器
│   ├── weibo.js         # 微博解析器
│   └── wechat.js        # 微信公众号解析器
├── utils/               # 工具函数
│   ├── config.js        # 配置文件
│   ├── helper.js        # 辅助函数
│   ├── response.js      # 响应格式化
│   └── realisticHeaders.js  # 随机请求头生成
├── index.js             # 主入口文件
├── Dockerfile           # Docker 配置
├── package.json         # 项目依赖
└── container.config.json # 微信云托管配置
```

## 更新日志

### v2.0.0 (2025-07-20)
- ✨ 添加随机请求头生成器，提升反爬虫能力
- ✨ 抖音解析器升级，支持直接获取无水印视频
- 🔧 优化视频获取逻辑，直接请求最高画质
- 📝 完善项目文档

### v1.0.0
- 🎉 初始版本发布
- ✨ 支持五大平台内容解析
- ✨ 实现文件代理功能

## License

MIT