/**
 * 抖音解析器
 */
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../utils/config');
const { findUrl, retry } = require('../utils/helper');
const Response = require('../utils/response');
const { generatePlatformHeaders } = require('../utils/realisticHeaders');

class DouyinParser {
  constructor(text, type = 'mp4') {
    this.text = text;
    this.url = findUrl(text);
    this.type = type;
    this.description = '';
    this.imageList = [];
    this.video = '';
    this.title = '';
    this.finalUrl = null;
    this.html = '';
  }

  /**
   * 解析抖音内容
   */
  async parse() {
    try {
      if (!this.url) {
        throw new Error(`无法从文本 '${this.text}' 中提取 URL`);
      }

      // 使用随机请求头
      const headers = generatePlatformHeaders('douyin');

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

      console.log('最终URL:', this.finalUrl);
      console.log('HTML长度:', this.html.length);

      const $ = cheerio.load(this.html);
      this.title = $('title').text() || '';

      // 检测是否为 slides 类型
      const isSlides = this.finalUrl.includes('/share/slides/') || this.finalUrl.includes('is_slides=1');

      if (isSlides) {
        console.log('检测到 slides 图片类型');
        // 提取slides ID并尝试API获取
        const slidesIdMatch = this.finalUrl.match(/\/slides\/(\d+)/);
        if (slidesIdMatch) {
          const success = await this.fetchSlidesDataFromAPI(slidesIdMatch[1]);
          if (success) {
            return this.toDict();
          }
        }
      }

      // 提取抖音数据（视频或其他类型）
      await this.extractDouyinData();

      return this.toDict();
    } catch (error) {
      console.error('抖音解析错误:', error.message);
      throw error;
    }
  }

  /**
   * 通过API获取slides数据
   */
  async fetchSlidesDataFromAPI(slidesId) {
    try {
      console.log('通过API获取slides数据, ID:', slidesId);

      const apiUrl = `https://www.douyin.com/aweme/v1/web/aweme/detail/`;
      const headers = generatePlatformHeaders('douyin');
      headers['Referer'] = `https://www.iesdouyin.com/share/slides/${slidesId}/`;

      const response = await axios.get(apiUrl, {
        params: {
          aweme_id: slidesId,
          aid: 1128,
          device_platform: 'webapp',
          pc_client_type: 1
        },
        headers,
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      if (response.data && response.data.aweme_detail) {
        const item = response.data.aweme_detail;
        this.description = item.desc || '';

        // 提取图片
        if (item.images && item.images.length > 0) {
          console.log(`API返回 ${item.images.length} 张图片`);
          this.getImageData(item.images);
          return true;
        }
      }

      console.log('API未返回slides数据');
      return false;
    } catch (error) {
      console.warn('API获取slides失败:', error.message);
      return false;
    }
  }

  /**
   * 提取抖音内容
   */
  async extractDouyinData() {
    try {
      const $ = cheerio.load(this.html);
      const scripts = $('script');
      let found = false;

      // 使用 for 循环代替 .each() 以支持 async/await
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const content = $(script).html();
        if (content && content.includes('window._ROUTER_DATA')) {
          try {
            const dataText = content.split('window._ROUTER_DATA = ')[1];
            const routerData = JSON.parse(dataText);
            const loaderData = routerData.loaderData || {};

            console.log('loaderData keys:', Object.keys(loaderData));

            let dataDict = {};

            // 判断是图集还是视频
            if (loaderData['slides_(id)']) {
              console.log('检测到 slides 类型');
              dataDict = loaderData['slides_(id)'];
            } else if (loaderData['slides_(id)/page']) {
              console.log('检测到 slides/page 类型');
              dataDict = loaderData['slides_(id)/page'];
            } else if (loaderData['note_(id)']) {
              dataDict = loaderData['note_(id)'];
            } else if (loaderData['note_(id)/page']) {
              dataDict = loaderData['note_(id)/page'];
            } else if (loaderData['video_(id)']) {
              dataDict = loaderData['video_(id)'];
            } else if (loaderData['video_(id)/page']) {
              dataDict = loaderData['video_(id)/page'];
            }

            console.log('找到_ROUTER_DATA数据');
            console.log('dataDict keys:', Object.keys(dataDict));
            await this.getDictData(dataDict);
            found = true;
            break; // 跳出循环
          } catch (error) {
            console.warn('抖音数据解析失败:', error.message);
          }
        }
      }

      if (!found) {
        console.log('未找到_ROUTER_DATA数据');
        // 查找其他可能的数据源
        const scriptTexts = [];
        for (let i = 0; i < scripts.length; i++) {
          const content = $(scripts[i]).html();
          if (content && (content.includes('RENDER_DATA') || content.includes('__INITIAL_DATA__'))) {
            console.log('找到其他数据源');
            scriptTexts.push(content.substring(0, 200) + '...');
          }
        }
        if (scriptTexts.length > 0) {
          console.log('脚本内容预览:', scriptTexts);
        }
        // 如果没有找到数据，尝试从meta标签获取基本信息
        this.getMetaDescription();
      }
    } catch (error) {
      console.error('抖音数据提取错误:', error.message);
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
   * 获取抖音内容数据
   */
  async getDictData(dataDict) {
    try {
      console.log('dataDict 结构:', JSON.stringify(Object.keys(dataDict), null, 2));

      const videoInfoRes = dataDict.videoInfoRes || {};
      const itemList = videoInfoRes.item_list || [];
      const itemData = itemList[0] || {};

      console.log('itemData keys:', Object.keys(itemData));
      console.log('itemData.images 存在:', !!itemData.images);
      console.log('itemData.video 存在:', !!itemData.video);

      this.description = itemData.desc || '';

      // 获取图片数据
      const imageData = itemData.images || [];
      if (imageData.length > 0) {
        console.log(`找到 ${imageData.length} 张图片`);
        this.getImageData(imageData);
      } else {
        console.log('未找到图片数据');
      }

      // 获取视频数据
      const videoData = itemData.video || {};
      if (Object.keys(videoData).length > 0) {
        console.log('找到视频数据');
        await this.getVideoData(videoData);
      } else {
        console.log('未找到视频数据');
      }
    } catch (error) {
      console.warn('获取抖音数据失败:', error.message);
    }
  }

  /**
   * 获取图片数据
   */
  getImageData(imageData) {
    try {
      this.imageList = [];
      for (const item of imageData) {
        const urlList = item.url_list || [];
        if (urlList.length > 0) {
          this.imageList.push(urlList[0]);
        }
      }
    } catch (error) {
      console.warn('获取图片数据失败:', error.message);
      this.imageList = [];
    }
  }

  /**
   * 获取视频数据
   */
  async getVideoData(videoData) {
    try {
      console.log('开始获取视频数据...');
      // 先尝试从页面中提取 video_id
      const videoPlayId = this.extractVideoPlayId();
      
      if (videoPlayId) {
        // 使用高级方法获取多画质视频
        const bestVideoUrl = await this.getBestQualityVideo(videoPlayId);
        if (bestVideoUrl) {
          this.video = bestVideoUrl;
          return;
        }
      }
      
      // 如果高级方法失败，回退到原始方法
      const playAddr = videoData.play_addr || {};
      const urlList = playAddr.url_list || [];
      let videoUrl = urlList[0] || '';
      
      // 过滤音频链接
      if (videoUrl.includes('mp3')) {
        this.video = '';
      } else {
        // 移除水印：将 playwm 替换为 play
        this.video = videoUrl.replace('playwm', 'play');
      }
    } catch (error) {
      console.warn('获取视频数据失败:', error.message);
      this.video = '';
    }
  }

  /**
   * 从页面中提取视频播放ID
   */
  extractVideoPlayId() {
    try {
      console.log('开始提取video_id...');
      // 尝试从各种可能的位置提取video_id
      const patterns = [
        /"video_id":"([^"]+)"/,
        /'video_id':'([^']+)'/,
        /videoId:"([^"]+)"/,
        /vid:"([^"]+)"/,
        /video_id=([^&"']+)/,
        /"vid":"([^"]+)"/,
        /playId:"([^"]+)"/,
        /"playId":"([^"]+)"/
      ];
      
      for (const pattern of patterns) {
        const match = this.html.match(pattern);
        if (match && match[1]) {
          // console.log('找到video_id:', match[1]);
          return match[1];
        }
      }
      
      // 尝试查找v0300之类的ID模式
      const v0300Match = this.html.match(/v0300[a-zA-Z0-9]{20,}/);
      if (v0300Match) {
        // console.log('找到v0300格式的video_id:', v0300Match[0]);
        return v0300Match[0];
      }
      
      // console.log('未找到video_id');
      return null;
    } catch (error) {
      console.warn('提取video_id失败:', error.message);
      return null;
    }
  }

  /**
   * 获取最高画质的视频
   */
  async getBestQualityVideo(videoPlayId) {
    try {
      // 直接请求最高画质 1080p，如果不存在会自动返回合适的画质
      const playUrl = `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoPlayId}&ratio=1080p&line=0`;
      
      const headers = generatePlatformHeaders('douyin');
      const response = await axios.get(playUrl, {
        headers,
        maxRedirects: 2,
        validateStatus: (status) => status < 400,
        timeout: 10000
      });
      
      const downloadUrl = response.request.res.responseUrl || response.config.url;
      
      // 检查是否是有效的视频URL
      if (downloadUrl && !downloadUrl.includes('aweme.snssdk.com')) {
        return downloadUrl;
      }
      
      // 如果失败，返回默认URL
      return `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoPlayId}&ratio=720p&line=0`;
    } catch (err) {
      console.warn('获取高画质视频失败:', err.message);
      // 出错时返回默认的720p链接
      return `https://aweme.snssdk.com/aweme/v1/play/?video_id=${videoPlayId}&ratio=720p&line=0`;
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
        app_type: 'douyin',
      };
      
      return Response.success(result, '获取成功');
    } catch (error) {
      console.error('抖音转换为字典时出错:', error.message);
      return Response.error('获取失败');
    }
  }
}

module.exports = DouyinParser;