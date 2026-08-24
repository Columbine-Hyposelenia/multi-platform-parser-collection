const axios = require("axios");
const cheerio = require("cheerio");

/**
 * 微信公众号解析器
 */
class WechatParser {
  constructor(url, type = 'jpg') {
    this.url = url;
    this.type = type;
    this.platform = 'wechat';
  }

  async parse() {
    try {
      if (!this.url.includes('mp.weixin.qq.com')) {
        return {
          code: -1,
          message: '请提供有效的微信公众号文章链接'
        };
      }

      const headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Cookie': 'rewardsn=; wxtokenkey=777'
      };

      // 获取文章页面
      const response = await axios.get(this.url, { headers });
      const html = response.data;
      const $ = cheerio.load(html);
      
      // 提取文章基本信息（优先使用可靠的选择器）
      const title = $('meta[property="og:title"]').attr('content')
        || $('#activity-name').text().trim()
        || $('h1.rich_media_title').text().trim();

      const author = $('#js_name').text().trim()
        || $('.wx_follow_nickname').text().trim()
        || $('.rich_media_meta_text').first().text().trim();

      const publishTime = this.extractPublishTime(html, $);
      
      // 检测是否是轮播图文章
      const isSwiper = html.includes('has-related-image') || html.includes('share_media_swiper');
      
      // 提取文章正文内容
      const content = this.extractContent($);
      
      // 获取封面图片
      const coverImage = this.getCoverImage($);
      
      // 获取内容图片（包括轮播图）
      const contentImages = isSwiper ? 
        this.getSwiperImages(html, $) : 
        this.getContentImages($);
      
      // 构建返回数据 - 统一格式
      const imageList = [];
      
      // 添加封面图
      if (coverImage) {
        imageList.push(coverImage.url);
      }
      
      // 添加内容图片
      contentImages.forEach((img) => {
        imageList.push(img.url);
      });
      
      const result = {
        code: 0,
        message: '解析成功',
        data: {
          app_type: '微信公众号',
          title: title,
          author: author.replace(/\s+/g, ' ').trim(),
          publish_time: publishTime,
          description: content.paragraphs.slice(0, 3).join(' '),
          content: content.text,
          image_list: imageList,
          type: isSwiper ? 'swiper' : 'article',
          url: this.url
        },
        timestamp: new Date().toISOString()
      };
      
      return result;
      
    } catch (error) {
      console.error('微信公众号解析失败:', error.message);
      return {
        code: -1,
        message: '解析失败: ' + error.message
      };
    }
  }

  /**
   * 提取轮播图片 - 只返回原图链接
   */
  getSwiperImages(html, $) {
    const images = [];
    
    // 使用正则表达式提取完整的图片数据结构
    const picDataPattern = /{\s*width:\s*['"]?\d+['"]?\s*\*\s*1,\s*height:\s*['"]?\d+['"]?\s*\*\s*1,\s*cdn_url:\s*['"]([^'"]+)['"][^}]*},\s*watermark_info:\s*{\s*cdn_url:\s*['"]([^'"]+)['"]/g;
    
    let match;
    const seen = new Set();
    
    while ((match = picDataPattern.exec(html)) !== null) {
      const originalUrl = match[1];
      
      // 只取原图，跳过水印图
      if (!seen.has(originalUrl)) {
        seen.add(originalUrl);
        images.push({
          url: originalUrl,
          format: originalUrl.includes('wx_fmt=png') ? 'png' : 'jpg',
          type: 'swiper'
        });
      }
    }
    
    // 如果没有找到配对的数据，使用备用方法
    if (images.length === 0) {
      const cdnUrlPattern = /cdn_url:\s*['"]([^'"]+)['"]/g;
      const matches = [...html.matchAll(cdnUrlPattern)];
      
      matches.forEach((match) => {
        const url = match[1];
        if (url.includes('mmbiz.qpic.cn') && url.startsWith('https://')) {
          // 只取HTTPS的原图
          if (!seen.has(url)) {
            seen.add(url);
            images.push({
              url: url,
              format: url.includes('wx_fmt=png') ? 'png' : 'jpg',
              type: 'swiper'
            });
          }
        }
      });
    }
    
    return images;
  }

  /**
   * 提取文章内容
   */
  extractContent($) {
    const contentDiv = $('#js_content');
    
    // 提取纯文本
    const text = contentDiv.text().trim();
    
    // 按段落分割
    const paragraphs = [];
    contentDiv.find('p, div').each((index, element) => {
      const paragraphText = $(element).text().trim();
      if (paragraphText && paragraphText.length > 10) {
        paragraphs.push(paragraphText);
      }
    });
    
    return {
      text,
      paragraphs
    };
  }

  /**
   * 获取封面图片
   */
  getCoverImage($) {
    const ogImage = $('meta[property="og:image"]').attr('content');
    const twitterImage = $('meta[property="twitter:image"]').attr('content');
    
    let coverUrl = null;
    let source = null;
    
    if (ogImage) {
      coverUrl = ogImage;
      source = 'og:image';
    } else if (twitterImage) {
      coverUrl = twitterImage;
      source = 'twitter:image';
    }
    
    return coverUrl ? {
      url: coverUrl,
      source: source,
      type: 'cover'
    } : null;
  }

  /**
   * 获取内容图片（普通文章）
   */
  getContentImages($) {
    const images = [];

    $('#js_content img').each((index, element) => {
      // 优先取 data-src（懒加载），再取 src
      const src = $(element).attr('data-src') || $(element).attr('src');
      if (src && src.includes('mmbiz.qpic.cn')) {
        const className = $(element).attr('class') || '';
        if (!className.includes('avatar') && !className.includes('head')) {
          images.push({
            url: src,
            format: src.includes('wx_fmt=png') ? 'png' : 'jpg',
            type: 'content'
          });
        }
      }
    });

    return images;
  }

  /**
   * 提取发布时间
   */
  extractPublishTime(html, $) {
    // 方法1: 从页面脚本变量提取 (ct = create_time)
    const ctMatch = html.match(/var\s+ct\s*=\s*"?(\d+)"?/);
    if (ctMatch) {
      const timestamp = parseInt(ctMatch[1]) * 1000;
      return new Date(timestamp).toISOString().split('T')[0];
    }

    // 方法2: 从 createTime 变量提取
    const createTimeMatch = html.match(/createTime\s*=\s*'([^']+)'/);
    if (createTimeMatch) {
      return createTimeMatch[1];
    }

    // 方法3: 从 publish_time 元素
    const publishTime = $('#publish_time').text().trim();
    if (publishTime) {
      return publishTime;
    }

    // 方法4: 从 meta 标签
    const articleTime = $('meta[property="article:published_time"]').attr('content');
    if (articleTime) {
      return articleTime.split('T')[0];
    }

    return '';
  }
}

module.exports = WechatParser;