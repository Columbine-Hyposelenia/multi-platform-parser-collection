/**
 * 配置文件
 */
const config = {
  // 平台关键词映射
  APP_TYPE_KEYWORD: {
    xiaohongshu: ['小红书', 'xhs', 'xiaohongshu', 'redbook'],
    douyin: ['抖音', 'douyin', 'dy', 'tiktok'],
    kuaishou: ['快手', 'kuaishou', 'ks', 'kwai'],
    weibo: ['微博', 'weibo', 'wb', 'sina'],
    wechat: ['微信', 'wechat', 'weixin', '公众号']
  },

  // 用户代理
  DEFAULT_USER_AGENT: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  MOBILE_USER_AGENT: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',

  // 请求超时设置
  REQUEST_TIMEOUT: 15000,

  // 最大重试次数
  MAX_RETRIES: 3,

  // 支持的图片格式
  SUPPORTED_IMAGE_FORMATS: ['png', 'webp', 'jpg', 'jpeg'],

  // 平台域名匹配
  PLATFORM_DOMAINS: {
    xiaohongshu: ['xiaohongshu.com', 'xhslink.com'],
    douyin: ['douyin.com', 'iesdouyin.com', 'v.douyin.com'],
    kuaishou: ['kuaishou.com', 'chenzhongtech.com'],
    weibo: ['weibo.com', 'weibo.cn', 't.cn'],
    wechat: ['mp.weixin.qq.com']
  }
};

module.exports = config;