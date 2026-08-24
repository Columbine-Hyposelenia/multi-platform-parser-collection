/**
 * 小红书解析器
 */
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../utils/config');
const { findUrl, retry } = require('../utils/helper');
const Response = require('../utils/response');
// const { generatePlatformHeaders } = require('../utils/realisticHeaders');

class XiaohongshuParser {
  constructor(text, type = 'webp') {
    this.text = text;
    this.url = findUrl(text);
    this.type = type;
    this.video = '';
    this.imageList = [];
    this.liveList = [];
    this.description = '';
    this.finalUrl = null;
    this.html = '';
    this.title = '';
    this.data = {};
  }

  /**
   * 解析小红书内容
   */
  async parse() {
    try {
      if (!this.url) {
        throw new Error(`无法从文本 '${this.text}' 中提取 URL`);
      }

      // 获取重定向 URL
      const headers = {
        'User-Agent': config.DEFAULT_USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': 'https://www.google.com/',
      };

      const response = await retry(async () => {
        return await axios.get(this.url, {
          headers,
          timeout: config.REQUEST_TIMEOUT,
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
      });

      this.finalUrl = response.request.res.responseUrl || response.config.url;
      
      if (this.finalUrl.includes('404')) {
        throw new Error(`小红书链接已失效: ${this.finalUrl}`);
      }

      this.html = response.data;
      
      // 使用 cheerio 解析 HTML
      const $ = cheerio.load(this.html);
      this.title = $('title').text() || '';
      
      // 提取小红书数据
      await this.extractXiaohongshuData();
      
      return this.toDict();
    } catch (error) {
      console.error('小红书解析错误:', error.message);
      throw error;
    }
  }

  /**
   * 从 HTML 中提取小红书数据
   */
  async extractXiaohongshuData() {
    try {
      // 查找包含 JSON 数据的脚本标签
      const $ = cheerio.load(this.html);
      const scripts = $('script');
      let found = false;

      scripts.each((index, script) => {
        const content = $(script).html();
        if (content && content.includes('window.__INITIAL_STATE__')) {
          try {
            // 提取 JSON 数据
            const dataText = content.split('window.__INITIAL_STATE__=')[1];
            // 把字符串中的undefined替换为null
            const cleanedData = dataText.replace(/undefined/g, 'null');
            
            try {
              this.data = JSON.parse(cleanedData);
              this.getImageList();
              this.getVideo();
              this.getMetaDescription();
              found = true;
              return false; // 跳出循环
            } catch (jsonError) {
              console.warn('JSON解析失败:', jsonError.message);
            }
          } catch (error) {
            console.warn('数据提取失败:', error.message);
          }
        }
      });

      if (!found) {
        // 如果没有找到数据，尝试从meta标签获取基本信息
        this.getMetaDescription();
      }
    } catch (error) {
      console.error('小红书数据提取错误:', error.message);
      throw error;
    }
  }

  /**
   * 获取页面的元描述
   */
  getMetaDescription() {
    try {
      const $ = cheerio.load(this.html);
      const meta = $('meta[name=\"description\"]').attr('content') || 
                   $('meta[property=\"og:description\"]').attr('content') || '';
      this.description = meta;
    } catch (error) {
      console.warn('获取描述失败:', error.message);
      this.description = '';
    }
  }

  /**
   * 获取图片列表
   */
  getImageList() {
    try {
      const note = this.data.note || {};
      const noteDetailMap = note.noteDetailMap || {};
      const firstNoteId = note.firstNoteId || '';
      const noteData = noteDetailMap[firstNoteId]?.note || {};
      const imageList = noteData.imageList || [];
      
      const tokenList = [];
      for (const image of imageList) {
        if (image.urlDefault) {
          tokenList.push(image.urlDefault);
        }
        
        // 获取live图片
        const liveUrl = image.stream?.h264?.[0]?.masterUrl;
        if (liveUrl) {
          this.liveList.push(liveUrl);
        }
      }
      
      this.imageList = this.processImageList(tokenList);
    } catch (error) {
      console.warn('获取图片列表失败:', error.message);
      this.imageList = [];
    }
  }

  /**
   * 处理图片列表，生成无水印链接
   */
  processImageList(tokenList) {
    const processedImages = [];
    
    for (const imageUrl of tokenList) {
      try {
        const token = this.getImageToken(imageUrl);
        let processedUrl;
        
        if (this.type === 'webp') {
          processedUrl = this.generateWebpLink(token);
        } else if (this.type === 'png') {
          processedUrl = this.generatePngLink(token);
        } else {
          processedUrl = imageUrl;
        }
        
        processedImages.push(processedUrl);
      } catch (error) {
        console.warn('处理图片失败:', error.message);
        processedImages.push(imageUrl);
      }
    }
    
    return processedImages;
  }

  /**
   * 获取图片token
   */
  getImageToken(url) {
    try {
      const arr = url.split('/');
      if (arr.some(part => part.includes('notes_pre_post'))) {
        return '/notes_pre_post/' + arr[arr.length - 1].split('!')[0];
      } else {
        return arr[arr.length - 1].split('!')[0];
      }
    } catch (error) {
      console.warn('获取图片token失败:', error.message);
      return url;
    }
  }

  /**
   * 生成webp链接
   */
  generateWebpLink(token) {
    return `https://sns-img-bd.xhscdn.com/${token}`;
  }

  /**
   * 生成png链接
   */
  generatePngLink(token) {
    return `https://ci.xiaohongshu.com/${token}?imageView2/format/png`;
  }

  /**
   * 获取视频
   */
  getVideo() {
    try {
      const note = this.data.note || {};
      const noteDetailMap = note.noteDetailMap || {};
      const firstNoteId = note.firstNoteId || '';
      const noteData = noteDetailMap[firstNoteId]?.note || {};
      const videoInfo = noteData.video?.media || {};
      const masterUrl = videoInfo.stream?.h264?.[0]?.masterUrl;
      
      this.video = masterUrl || '';
    } catch (error) {
      console.warn('获取视频失败:', error.message);
      this.video = '';
    }
  }

  /**
   * 转换为字典格式
   */
  toDict() {
    try {
      const result = {
        url: this.url,
        final_url: this.finalUrl ? String(this.finalUrl) : null,
        title: this.title,
        description: this.description,
        image_list: this.imageList,
        live_list: this.liveList,
        video: this.video,
        app_type: 'xiaohongshu',
      };
      
      return Response.success(result, '获取成功');
    } catch (error) {
      throw new Error(`小红书转换为字典时出错: ${error.message}`);
    }
  }
}

module.exports = XiaohongshuParser;