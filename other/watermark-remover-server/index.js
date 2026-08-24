const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const axios = require("axios");
const { ParserFactory } = require("./parsers");
const Response = require("./utils/response");
const { generateRealisticHeaders } = require("./utils/realisticHeaders");

const logger = morgan("tiny");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

const port = process.env.PORT || 9000;

// 统一社交媒体解析接口
app.post("/analyze", async (req, res) => {
  try {
    const { url, type = 'webp', format = 'json' } = req.body;;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`解析社交媒体内容: ${url}`);
    
    const result = await ParserFactory.autoParse(url, type, format);
    
    if (result.code === 0) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('解析失败:', error);
    res.status(500).json(Response.serverError('解析失败: ' + error.message));
  }
});

// 小红书专用解析接口
app.post("/analyze/xiaohongshu", async (req, res) => {
  try {
    const { url, type = 'webp', format = 'json' } = req.body;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`解析小红书内容: ${url}`);
    
    const parser = ParserFactory.createParser('xiaohongshu', url, type);
    const result = await parser.parse();
    
    if (format === 'html') {
      const htmlResult = ParserFactory.formatAsHtml(result);
      res.json(htmlResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('小红书解析失败:', error);
    res.status(500).json(Response.serverError('解析失败: ' + error.message));
  }
});

// 抖音专用解析接口
app.post("/analyze/douyin", async (req, res) => {
  try {
    const { url, type = 'mp4', format = 'json' } = req.body;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`解析抖音内容: ${url}`);
    
    const parser = ParserFactory.createParser('douyin', url, type);
    const result = await parser.parse();
    
    if (format === 'html') {
      const htmlResult = ParserFactory.formatAsHtml(result);
      res.json(htmlResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('抖音解析失败:', error);
    res.status(500).json(Response.serverError('解析失败: ' + error.message));
  }
});

// 快手专用解析接口
app.post("/analyze/kuaishou", async (req, res) => {
  try {
    const { url, type = 'mp4', format = 'json' } = req.body;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`解析快手内容: ${url}`);
    
    const parser = ParserFactory.createParser('kuaishou', url, type);
    const result = await parser.parse();
    
    if (format === 'html') {
      const htmlResult = ParserFactory.formatAsHtml(result);
      res.json(htmlResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('快手解析失败:', error);
    res.status(500).json(Response.serverError('解析失败: ' + error.message));
  }
});

// 微博专用解析接口
app.post("/analyze/weibo", async (req, res) => {
  try {
    const { url, type = 'mp4', format = 'json' } = req.body;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`解析微博内容: ${url}`);
    
    const parser = ParserFactory.createParser('weibo', url, type);
    const result = await parser.parse();
    
    if (format === 'html') {
      const htmlResult = ParserFactory.formatAsHtml(result);
      res.json(htmlResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('微博解析失败:', error);
    res.status(500).json(Response.serverError('解析失败: ' + error.message));
  }
});

// 微信公众号专用解析接口
app.post("/analyze/wechat", async (req, res) => {
  try {
    const { url, type = 'jpg', format = 'json' } = req.body;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`解析微信公众号内容: ${url}`);
    
    const parser = ParserFactory.createParser('wechat', url, type);
    const result = await parser.parse();
    
    if (format === 'html') {
      const htmlResult = ParserFactory.formatAsHtml(result);
      res.json(htmlResult);
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error('微信公众号解析失败:', error);
    res.status(500).json(Response.serverError('解析失败: ' + error.message));
  }
});

// 文件流下载接口
app.get("/system/get_file_stream", async (req, res) => {
  try {
    const { url, filename } = req.query;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`处理文件流请求: ${url}`);
    
    // 使用 axios 获取文件流
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    // 获取内容类型
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    // 处理文件名
    let downloadFilename = filename;
    if (!downloadFilename) {
      // 尝试从响应头获取文件名
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        downloadFilename = contentDisposition.split('filename=')[1].replace(/['"]/g, '');
      } else {
        // 从URL路径获取文件名
        const urlParts = url.split('/');
        downloadFilename = urlParts[urlParts.length - 1].split('?')[0] || 'downloaded_file';
      }
    }
    
    // 设置响应头
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${downloadFilename}"`,
      'Cache-Control': 'no-cache'
    });
    
    // 直接将文件流管道到响应
    response.data.pipe(res);
    
    // 处理流错误
    response.data.on('error', (error) => {
      console.error('文件流错误:', error);
      if (!res.headersSent) {
        res.status(500).json(Response.serverError('文件流传输错误'));
      }
    });
    
  } catch (error) {
    console.error('文件流下载失败:', error);
    if (!res.headersSent) {
      if (error.response) {
        res.status(error.response.status).json(Response.error(`远程服务器错误: ${error.message}`));
      } else {
        res.status(500).json(Response.serverError('文件流下载失败: ' + error.message));
      }
    }
  }
});

// 图片代理接口
app.get("/system/image_proxy", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`处理图片代理请求: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        ...generateRealisticHeaders(),
        'Referer': 'https://weibo.com'
      }
    });
    
    // 获取原始响应的内容类型
    const contentType = response.headers['content-type'] || 'image/jpeg';
    
    // 设置响应头
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400' // 缓存1天
    });
    
    // 直接将图片流管道到响应
    response.data.pipe(res);
    
    // 处理流错误
    response.data.on('error', (error) => {
      console.error('图片代理错误:', error);
      if (!res.headersSent) {
        res.status(500).json(Response.serverError('图片代理错误'));
      }
    });
    
  } catch (error) {
    console.error('图片代理失败:', error);
    if (!res.headersSent) {
      if (error.response) {
        res.status(error.response.status).json(Response.error(`远程服务器错误: ${error.message}`));
      } else {
        res.status(500).json(Response.serverError('图片代理失败: ' + error.message));
      }
    }
  }
});

// 资源代理下载接口
app.get("/system/proxy", async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json(Response.validationError('缺少url参数'));
    }
    
    console.log(`处理资源代理请求: ${url}`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000,
      headers: {
        ...generateRealisticHeaders(),
        "Referer": "https://www.duoleta.com/"
      }
    });
    
    // 获取内容类型
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    
    console.log(`响应状态码: ${response.status}`);
    console.log(`响应头: ${JSON.stringify(response.headers)}`);
    
    // 设置响应头
    res.set({
      'Content-Type': contentType
    });
    
    // 直接将资源流管道到响应
    response.data.pipe(res);
    
    // 处理流错误
    response.data.on('error', (error) => {
      console.error('资源代理错误:', error);
      if (!res.headersSent) {
        res.status(500).json(Response.serverError('资源代理错误'));
      }
    });
    
  } catch (error) {
    console.error('资源代理失败:', error);
    if (!res.headersSent) {
      if (error.response) {
        res.status(error.response.status).json(Response.error(`远程服务器错误: ${error.message}`));
      } else {
        res.status(500).json(Response.serverError('资源代理失败: ' + error.message));
      }
    }
  }
});


// 启动服务
app.listen(port, "0.0.0.0", () => {
  console.log("============================");
  console.log("社交媒体解析服务启动成功");
  console.log(`监听端口: ${port}`);
  console.log("============================");
  console.log("可用接口:");
  console.log("- POST /analyze                    自动识别平台解析");
  console.log("- POST /analyze/xiaohongshu        解析小红书");
  console.log("- POST /analyze/douyin             解析抖音");
  console.log("- POST /analyze/kuaishou           解析快手");
  console.log("- POST /analyze/weibo              解析微博");
  console.log("- POST /analyze/wechat             解析微信公众号");
  console.log("- GET  /system/get_file_stream     文件流下载");
  // console.log("- GET  /system/image_proxy         图片代理");
  // console.log("- GET  /system/proxy               资源代理下载");
  console.log("============================");
});
