/**
 * 快手解析器
 */
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../utils/config');
const { findUrl, retry } = require('../utils/helper');
const Response = require('../utils/response');
// const { generatePlatformHeaders } = require('../utils/realisticHeaders');

class KuaishouParser {
  constructor(text, type = 'mp4') {
    this.text = text;
    this.url = findUrl(text);
    this.type = type;
    this.description = '';
    this.video = '';
    this.imageList = [];
    this.imagePrefix = 'https://tx2.a.kwimgs.com/';
    this.title = '';
    this.finalUrl = null;
    this.html = '';
    this.dataDict = {};
  }

  /**
   * 解析快手内容
   */
  async parse() {
    try {
      if (!this.url) {
        throw new Error(`无法从文本 '${this.text}' 中提取 URL`);
      }

      const headers = {
        'User-Agent': config.MOBILE_USER_AGENT,
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
      this.html = response.data;
      
      const $ = cheerio.load(this.html);
      this.title = $('title').text() || '';

      // 提取快手数据
      await this.extractKuaishouData();
      
      return this.toDict();
    } catch (error) {
      console.error('快手解析错误:', error.message);
      throw error;
    }
  }

  /**
   * 提取快手内容
   */
  async extractKuaishouData() {
    try {
      const $ = cheerio.load(this.html);
      const scripts = $('script');
      let found = false;

      scripts.each((_, script) => {
        const content = $(script).html();
        if (content && content.includes('window.INIT_STATE')) {
          try {
            const dataText = content.split('window.INIT_STATE = ')[1];
            this.dataDict = JSON.parse(dataText);
            found = true;
            return false; // 跳出循环
          } catch (error) {
            console.warn('快手数据解析失败:', error.message);
          }
        }
      });

      if (found) {
        this.getDictData();
      } else {
        // 如果没有找到数据，尝试从meta标签获取基本信息
        this.getMetaDescription();
      }
    } catch (error) {
      console.error('快手数据提取错误:', error.message);
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
   * 获取dict数据
   */
  getDictData() {
    try {
      const dataList = Object.values(this.dataDict);
      const obj1Data = dataList[2] || {};
      const obj2Data = obj1Data.photo || {};
      const obj3Data = obj2Data.manifest || {};
      const obj4Data = obj2Data.ext_params || {};
      
      // 获取视频数据
      if (Object.keys(obj3Data).length > 0) {
        this.getVideoData(obj3Data);
      }
      
      // 获取图片数据
      if (Object.keys(obj4Data).length > 0) {
        this.getImageData(obj4Data);
      }
      
      // 获取描述
      this.description = obj2Data.caption || '';
    } catch (error) {
      console.warn('获取快手数据失败:', error.message);
    }
  }

  /**
   * 获取视频数据
   */
  getVideoData(obj3Data) {
    try {
      const adaptationSet = obj3Data.adaptationSet || [];
      const adaptationSetItem = adaptationSet[0] || {};
      const representation = adaptationSetItem.representation || [];
      const representationItem = representation[0] || {};
      const backupUrl = representationItem.backupUrl || [];
      
      this.video = backupUrl[0] || '';
    } catch (error) {
      console.warn('获取视频数据失败:', error.message);
      this.video = '';
    }
  }

  /**
   * 获取图片数据
   */
  getImageData(obj4Data) {
    try {
      const atlas = obj4Data.atlas || {};
      const idList = atlas.list || [];
      
      this.imageList = [];
      for (const item of idList) {
        if (item) {
          this.imageList.push(this.imagePrefix + item);
        }
      }
    } catch (error) {
      console.warn('获取图片数据失败:', error.message);
      this.imageList = [];
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
        image_list: this.imageList,
        video: this.video,
        app_type: 'kuaishou',
      };
      
      return Response.success(result, '获取成功');
    } catch (error) {
      console.error('快手转换为字典时出错:', error.message);
      return Response.error('获取失败');
    }
  }
}

module.exports = KuaishouParser;