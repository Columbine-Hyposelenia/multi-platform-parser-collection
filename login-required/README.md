# 需登录方案（Login-Required）

> 本目录收录必须登录（Cookie/Token/Session）才能正常使用或达到最高质量的解析项目。
> 与免登录方案（各平台目录、universal/）严格分离，不得混放。

## 收录原则

1. 项目必须登录才能使用核心功能，或免登录仅能获取极低质量
2. 登录后必须达到该平台的最高质量标准
3. 优先选择免登录方案，需登录方案作为补充

## 项目列表

### 1. instaloader（Instagram）

- **目录**: [`./instaloader/`](./instaloader/)
- **Stars**: 13,200+ | **语言**: Python
- **适用平台**: Instagram
- **登录方式**: Session 文件 / 账号密码 / 2FA
- **覆盖媒体**: 帖子图片/视频/轮播、Stories、Highlights、Reels、IGTV、个人资料、标签、地点批量
- **质量**: Instagram 原图和原始视频，无压缩
- **为何需登录**: Instagram 反爬严格，Stories/Highlights/Reels/私密账号必须登录；公开帖子免登录方案见 cobalt
- **部署**: Python 库嵌入后端，封装为 API

### 2. pixivpy-async（Pixiv）

- **目录**: [`./pixivpy-async/`](./pixivpy-async/)
- **原作者**: Mikubill | **语言**: Python（asyncio）
- **适用平台**: Pixiv
- **登录方式**: access_token / refresh_token（需 Pixiv 账号）
- **覆盖媒体**: 作品详情、画师信息、搜索、排行、收藏、原图 URL
- **质量**: 通过 Pixiv API 获取原图地址
- **为何需登录**: Pixiv API 完整调用需 token，免登录仅能有限访问；免登录方案见 gallery-dl
- **部署**: 异步库嵌入 FastAPI 后端

## 登录配置说明

### instaloader

```bash
# 方式1：交互式登录（生成 Session 文件）
instaloader --login=your_username

# 方式2：Python 代码中使用 Session
import instaloader
L = instaloader.Instaloader()
L.load_session_from_file("your_username")
```

### pixivpy-async

```python
from pixivpy_async import AppPixivAPI
api = AppPixivAPI()
# 需要先通过 auth 流程获取 token
await api.login(refresh_token="your_refresh_token")
```

## 与免登录方案的关系

| 平台 | 免登录主用 | 需登录方案 | 关系 |
|------|-----------|-----------|------|
| Instagram | cobalt（公开帖子视频/图片） | instaloader（Stories/Reels/完整功能） | 互补，免登录优先 |
| Pixiv | gallery-dl（公开内容下载） | pixivpy-async（API 完整调用） | 互补，免登录优先 |
