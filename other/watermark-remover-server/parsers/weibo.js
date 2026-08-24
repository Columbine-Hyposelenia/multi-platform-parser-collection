/**
 * 微博解析器
 */
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../utils/config');
const { findUrl, retry } = require('../utils/helper');
const Response = require('../utils/response');
const { generatePlatformHeaders } = require('../utils/realisticHeaders');

class WeiboParser {
  constructor(text, type = 'mp4') {
    this.text = text;
    this.url = findUrl(text);
    this.type = type;
    this.description = '';
    this.video = '';
    this.imageList = [];
    this.title = '';
    this.finalUrl = null;
    this.html = '';
    this.author = '';
    this.publishTime = '';
  }

  /**
   * 解析微博内容
   */
  async parse() {
    try {
      if (!this.url) {
        throw new Error(`无法从文本 '${this.text}' 中提取 URL`);
      }

      // 使用随机请求头
      const headers = generatePlatformHeaders('weibo');

      const response = await retry(async () => {
        return await axios.get(this.url, {
          headers,
          timeout: config.REQUEST_TIMEOUT,
          maxRedirects: 5,
          validateStatus: (status) => status < 400
        });
      });

      this.finalUrl = response.request.res.responseUrl || response.config.url;
      this.html = response.data;
      
      const $ = cheerio.load(this.html);
      this.title = $('title').text() || '';

      // 提取微博数据
      await this.extractWeiboData();
      
      return this.toDict();
    } catch (error) {
      console.error('微博解析错误:', error.message);
      throw error;
    }
  }

  /**
   * 提取微博内容
   */
  async extractWeiboData() {
    try {
      const $ = cheerio.load(this.html);
      
      // 尝试从不同的位置提取数据
      this.extractFromScripts($);
      this.extractFromMeta($);
      this.extractFromHtml($);
    } catch (error) {
      console.error('微博数据提取错误:', error.message);
      throw error;
    }
  }

  /**
   * 从脚本标签提取数据
   */
  extractFromScripts($) {
    try {
      const scripts = $('script');
      let found = false;

      scripts.each((_, script) => {
        const content = $(script).html();
        if (content && (content.includes('$render_data') || content.includes('window.$render_data'))) {
          try {
            // 提取渲染数据
            const renderDataMatch = content.match(/\$render_data\s*=\s*(\[.*?\])\s*\[0\]/);
            if (renderDataMatch) {
              const renderData = JSON.parse(renderDataMatch[1]);
              const statusData = renderData[0]?.status || {};
              
              this.description = statusData.text || '';
              this.author = statusData.user?.screen_name || '';
              this.publishTime = statusData.created_at || '';
              
              // 提取图片
              const picIds = statusData.pic_ids || [];
              const picInfos = statusData.pic_infos || {};
              
              this.imageList = [];
              for (const picId of picIds) {
                const picInfo = picInfos[picId];
                if (picInfo && picInfo.large && picInfo.large.url) {
                  this.imageList.push(picInfo.large.url);
                }
              }
              
              // 提取视频
              const pageInfo = statusData.page_info || {};
              if (pageInfo.type === 'video' && pageInfo.urls) {
                const videoUrl = pageInfo.urls.mp4_720p_mp4 || 
                               pageInfo.urls.mp4_hd_mp4 || 
                               pageInfo.urls.mp4_ld_mp4;
                this.video = videoUrl || '';
              }
              
              found = true;
              return false; // 跳出循环
            }
          } catch (error) {
            console.warn('微博脚本数据解析失败:', error.message);
          }
        }
      });

      return found;
    } catch (error) {
      console.warn('从脚本提取数据失败:', error.message);
      return false;
    }
  }

  /**
   * 从meta标签提取数据
   */
  extractFromMeta($) {
    try {
      if (!this.description) {
        this.description = $('meta[name=\"description\"]').attr('content') || 
                          $('meta[property=\"og:description\"]').attr('content') || '';
      }
      
      if (!this.title) {
        this.title = $('meta[property=\"og:title\"]').attr('content') || 
                    $('meta[name=\"title\"]').attr('content') || '';
      }
      
      // 提取图片
      const ogImage = $('meta[property=\"og:image\"]').attr('content');
      if (ogImage && this.imageList.length === 0) {
        this.imageList.push(ogImage);
      }
    } catch (error) {
      console.warn('从meta标签提取数据失败:', error.message);
    }
  }

  /**
   * 从HTML结构提取数据
   */
  extractFromHtml($) {
    try {
      // 尝试从页面结构提取内容
      if (!this.description) {
        const contentText = $('.weibo-text').text() || 
                           $('.txt').text() || 
                           $('.content').text() || '';
        this.description = contentText.trim();
      }
      
      // 尝试提取作者信息
      if (!this.author) {
        const authorName = $('.name').text() || 
                          $('.username').text() || 
                          $('.user-name').text() || '';
        this.author = authorName.trim();
      }
      
      // 尝试提取图片
      if (this.imageList.length === 0) {
        const images = [];
        $('img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && (src.includes('sinaimg.cn') || src.includes('weibo.com'))) {
            // 过滤掉头像和小图标
            if (!src.includes('avatar') && !src.includes('icon') && 
                !src.includes('default') && src.includes('large')) {
              images.push(src);
            }
          }
        });
        this.imageList = images;
      }
    } catch (error) {
      console.warn('从HTML结构提取数据失败:', error.message);
    }
  }

  /**
   * 转换为字典格式
   */
  toDict() {
    try {
      const result = {
        url: this.url,
        final_url: this.finalUrl ? String(this.finalUrl) : '',
        title: this.title,
        description: this.description,
        author: this.author,
        publish_time: this.publishTime,
        image_list: this.imageList,
        video: this.video,
        app_type: 'weibo',
      };
      
      return Response.success(result, '获取成功');
    } catch (error) {
      console.error('微博转换为字典时出错:', error.message);
      return Response.error('获取失败');
    }
  }
}

module.exports = WeiboParser;