/**
 * 解析器入口文件
 */
const XiaohongshuParser = require('./xiaohongshu');
const DouyinParser = require('./douyin');
const KuaishouParser = require('./kuaishou');
const WeiboParser = require('./weibo');
const WechatParser = require('./wechat');
const { identifyPlatform } = require('../utils/helper');
const Response = require('../utils/response');

/**
 * 解析器工厂
 */
class ParserFactory {
  /**
   * 创建解析器实例
   * @param {string} platform 平台类型
   * @param {string} text 包含URL的文本
   * @param {string} type 解析类型
   * @returns {Object} 解析器实例
   */
  static createParser(platform, text, type) {
    switch (platform) {
      case 'xiaohongshu':
        return new XiaohongshuParser(text, type);
      case 'douyin':
        return new DouyinParser(text, type);
      case 'kuaishou':
        return new KuaishouParser(text, type);
      case 'weibo':
        return new WeiboParser(text, type);
      case 'wechat':
        return new WechatParser(text, type);
      default:
        throw new Error(`不支持的平台类型: ${platform}`);
    }
  }

  /**
   * 自动识别平台并解析
   * @param {string} text 包含URL的文本
   * @param {string} type 解析类型
   * @param {string} format 返回格式
   * @returns {Object} 解析结果
   */
  static async autoParse(text, type = 'webp', format = 'json') {
    try {
      // 自动识别平台
      const platform = identifyPlatform(text);
      
      if (!platform) {
        throw new Error('无法识别平台类型，请检查URL是否正确');
      }

      // 创建解析器
      const parser = this.createParser(platform, text, type);
      
      // 执行解析
      const result = await parser.parse();
      
      // 根据格式返回数据
      if (format === 'html') {
        return this.formatAsHtml(result);
      }
      
      return result;
    } catch (error) {
      console.error('自动解析失败:', error.message);
      return Response.error(error.message);
    }
  }

  /**
   * 格式化为HTML
   * @param {Object} result 解析结果
   * @returns {Object} HTML格式的结果
   */
  static formatAsHtml(result) {
    try {
      if (result.code !== 0) {
        return result;
      }

      const data = result.data;
      let html = `
        <div class="social-media-content">
          <h2>${data.title || '无标题'}</h2>
          <p class="description">${data.description || '无描述'}</p>
          <div class="meta">
            <span class="platform">${data.app_type}</span>
            ${data.author ? `<span class="author">${data.author}</span>` : ''}
            ${data.publish_time ? `<span class="time">${data.publish_time}</span>` : ''}
          </div>
      `;

      // 添加图片
      if (data.image_list && data.image_list.length > 0) {
        html += '<div class="images">';
        data.image_list.forEach((img, index) => {
          html += `<img src="${img}" alt="图片${index + 1}" loading="lazy" />`;
        });
        html += '</div>';
      }

      // 添加视频
      if (data.video) {
        html += `<div class="video">
          <video controls>
            <source src="${data.video}" type="video/mp4">
            您的浏览器不支持视频播放。
          </video>
        </div>`;
      }

      html += '</div>';

      return Response.success({
        ...data,
        html: html
      }, '获取成功');
    } catch (error) {
      console.error('格式化HTML失败:', error.message);
      return Response.error('格式化失败');
    }
  }

  /**
   * 获取支持的平台列表
   * @returns {Array} 支持的平台列表
   */
  static getSupportedPlatforms() {
    return [
      {
        name: 'xiaohongshu',
        displayName: '小红书',
        description: '支持图文、视频内容解析，提供无水印图片和视频'
      },
      {
        name: 'douyin',
        displayName: '抖音',
        description: '支持视频、图集内容解析，提供无水印视频'
      },
      {
        name: 'kuaishou',
        displayName: '快手',
        description: '支持视频、图集内容解析'
      },
      {
        name: 'weibo',
        displayName: '微博',
        description: '支持微博内容解析，包含图片和视频'
      },
      {
        name: 'wechat',
        displayName: '微信公众号',
        description: '支持微信公众号文章解析，提供无水印图片和轮播图'
      }
    ];
  }
}

module.exports = {
  ParserFactory,
  XiaohongshuParser,
  DouyinParser,
  KuaishouParser,
  WeiboParser,
  WechatParser
};