# 🎬 B站视频下载助手

> 专注于B站视频下载的全栈工具，支持批量处理、收藏夹、用户投稿等功能

> 💡 **建议登录B站账号后使用，可享受更好的体验和更高画质！**

## ✨ 功能特性

- 🎯 **多链接处理**：支持单个、批量、收藏夹、用户投稿处理
- 🎨 **现代化 UI**：毛玻璃效果、主题切换（白天/黑夜）、二次元背景自动轮换
- 🔐 **登录系统**：网站扫码登录、VIP 权限检测、登录状态保持
- 📥 **多格式下载**：视音完整、分离、仅音频、纯画面、封面
- 🎬 **多画质支持**：4K、1080P60、1080P+、1080P、720P 等（VIP 画质权限检查）
- 🎞️ **自定义格式**：视频格式（MP4/FLV/MKV/WebM）、音频格式（MP3/FLAC/AAC/M4A）
- ⚡ **批量处理**：支持批量去水印和下载
- 💾 **状态保持**：登录/退出后保持解析搜索结果
- 🌐 **云部署**：支持 Render、Docker 一键部署

## 🏗️ 项目结构

```
.
├── server.js                    # Express 后端服务器
├── services/                    # 服务模块
│   ├── bilibiliService.js      # 视频去水印服务
│   ├── multiPlatformService.js # 多平台解析服务
│   ├── videoParser.js          # 视频解析服务
│   └── ytdlpService.js         # yt-dlp 下载服务
├── public/                      # 前端静态文件
│   ├── index.html              # 主页面
│   ├── script.js               # 前端逻辑
│   ├── styles.css              # 样式表
│   └── images/                 # 背景图片（可选）
├── package.json                # Node.js 依赖
├── requirements.txt            # Python 依赖（yt-dlp）
├── Dockerfile                  # Docker 配置
├── README.md                   # 项目说明
├── 启动应用.bat                # 一键启动脚本（Windows）
└── 安装依赖-本地.bat           # 一键安装脚本（Windows）
```

## 🚀 快速开始

### 本地开发

**Windows 用户（推荐）**：
```bash
# 1. 安装依赖
双击运行：安装依赖-本地.bat

# 2. 启动服务器
双击运行：启动应用.bat
```

**手动安装**：
```bash
# 1. 安装 Node.js 依赖
npm install

# 2. 安装 Python 依赖（yt-dlp）
pip install yt-dlp

# 3. 启动服务器
npm start
```

**访问应用**：打开浏览器访问 `http://localhost:3000`

### 云部署

**快速步骤**：
1. 推送代码到 GitHub
2. 在 [Render](https://render.com/) 创建 Web Service
3. 选择 Docker 环境，连接 GitHub 仓库
4. 配置自定义域名（可选）
5. 等待部署完成

**仓库地址**：https://github.com/YiQing-House/bilibili-parser

## 📖 使用说明

### 单链接去水印

1. 在搜索框输入视频链接
2. 选择下载类型：视音完整、视音分离、仅音频、纯画面、封面
3. 选择视频格式（MP4/FLV/MKV/WebM）和音频格式（MP3/FLAC/AAC/M4A）
4. 选择画质（4K/1080P60/1080P+/1080P/720P 等）
5. 点击"去水印下载"

### 批量处理

1. 在搜索框输入多个链接（换行分隔）
2. 系统自动识别并批量处理
3. 点击"全部下载"或单独下载

### 收藏夹处理

1. 输入收藏夹链接或 ID
   - 链接格式：`https://space.bilibili.com/xxx/favlist?fid=xxx`
   - 或直接输入收藏夹 ID：`1765119834`
2. 系统自动处理收藏夹内所有视频
3. 批量下载

### 用户投稿处理

> ⚠️ **注意**：此功能需要登录B站账号才能使用

1. 输入用户主页链接
   - 格式：`https://space.bilibili.com/522224434`
2. 系统自动处理所有投稿视频
3. 批量下载

## 🎨 主题定制

### 背景图设置

项目已配置**二次元美少女主题**背景，支持**3分钟自动轮换**，不随主题切换。

**替换背景图**：
1. 准备图片（建议 1920x1080 或更高）
2. 将图片放入 `public/images/` 目录
   - 推荐命名：`bg1.jpg`, `bg2.jpg`, `bg3.jpg` 等
3. 修改 `public/script.js` 中的 `bgConfig`：
   ```javascript
   const bgConfig = {
       images: [
           'images/bg1.jpg',  // 本地图片
           'images/bg2.jpg',
           'images/bg3.jpg',
           // 或使用在线API
           'https://api.ixiaowai.cn/gqapi/gqapi.php',
       ],
       rotateInterval: 180000 // 3分钟轮换
   };
   ```

**特点**：
- ✅ 背景图每 3 分钟自动轮换
- ✅ 不随主题切换而改变
- ✅ 支持本地图片和在线 API
- ✅ 自动保存当前图片索引

**调整背景效果**：
在 `public/index.html` 中搜索 `.background-image` 调整 CSS：
```css
/* 调整模糊度 */
filter: blur(3px); /* 0为清晰 */

/* 调整透明度 */
opacity: 0.7; /* 0-1 */
```

### 主题颜色

主题颜色在 `public/index.html` 的 CSS 变量中定义：
- **白天主题**：蜜桃奶茶色（温暖柔和）
- **黑夜主题**：暗樱粉色（优雅护眼）

## 📡 API 接口

### POST /api/parse
处理视频链接

**请求**：
```json
{
  "url": "https://www.bilibili.com/video/BV1xx411c7mu"
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "title": "视频标题",
    "author": "UP主",
    "thumbnail": "缩略图URL",
    "duration": "时长"
  }
}
```

### GET /api/bilibili/favorites
处理收藏夹

**请求**：
```
GET /api/bilibili/favorites?id=1765119834
```

### GET /api/bilibili/user-videos
处理用户投稿

**请求**：
```
GET /api/bilibili/user-videos?uid=522224434
```

更多 API 文档请查看代码注释。

## 🛠️ 技术栈

- **后端**：Node.js + Express
- **前端**：原生 JavaScript + HTML + CSS
- **视频处理**：yt-dlp、ffmpeg
- **部署**：Docker、Render

## 📚 技术文档

- **项目结构**：查看上方项目结构说明
- **API 接口**：查看下方 API 接口文档
- **主题定制**：查看上方主题定制说明

## ⚠️ 注意事项

1. **API 限制**：免费处理 API 可能有调用频率限制
2. **VIP 权限**：部分画质需要会员权限，请先登录
3. **法律合规**：请确保使用符合相关法律法规
4. **资源消耗**：大文件下载会消耗服务器资源

## 🔒 安全建议

- 不要在前端代码中硬编码敏感信息
- 使用环境变量管理配置
- 实施适当的速率限制
- 验证和清理用户输入

## 📝 更新日志

### v3.0.0 (2025-12-10)
- ✨ 专注于B站视频下载，移除多平台预设
- ✨ 用户投稿解析采用 WBI 签名 + yt-dlp 备选方案
- ✨ 添加登录建议提示，未登录用户提示需要登录
- 📚 更新文档（关于我们、使用说明）
- 🛠️ 版本升级到 v3.0.0

### v2.9.0
- ✨ 新增自定义格式选择（视频格式：MP4/FLV/MKV/WebM，音频格式：MP3/FLAC/AAC/M4A）
- ✨ 背景图支持本地图片，3分钟自动轮换且不随主题切换
- ✨ 登录/退出后保持处理搜索结果，不再刷新页面
- 🐛 修复多链接识别问题（正确处理拼接链接）
- 🐛 修复收藏夹处理功能
- 🐛 修复 BV 号大小写问题
- 🎨 优化 UI 布局和格式选择显示逻辑
- 🔒 添加 VIP 权限检查，防止未授权访问高画质
- 🔄 优化登录流程，自动刷新页面

## 📞 技术支持

如有问题，请：
1. 检查浏览器控制台（F12）和服务器日志
2. 查看代码注释和 API 文档
3. 提交 [Issue](https://github.com/YiQing-House/bilibili-parser/issues)

## 📄 许可证

[MIT License](./LICENSE)

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

**仓库地址**：https://github.com/YiQing-House/bilibili-parser
