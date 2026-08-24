/**
 * 真实的请求头生成器
 * 用于模拟真实浏览器行为，避免被反爬虫机制识别
 */
const UserAgent = require('user-agents');
const { faker } = require('@faker-js/faker');

// 常见的引用来源
const commonReferers = [
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://www.baidu.com/',
  'https://duckduckgo.com/',
  'https://www.facebook.com/',
  'https://www.youtube.com/',
  'https://www.reddit.com/',
  'https://www.xiaohongshu.com/',
  'https://www.douyin.com/',
  'https://www.weibo.com/',
  'https://m.weibo.cn/',
  'https://weixin.qq.com/',
];

// 生成随机IP地址
function generateRandomIp() {
  return `${faker.number.int({ min: 1, max: 255 })}.${faker.number.int({ min: 0, max: 255 })}.${faker.number.int({ min: 0, max: 255 })}.${faker.number.int({ min: 1, max: 254 })}`;
}

// 生成随机Cookie
function generateCookie() {
  const cookies = [];
  
  // 基础会话cookie
  cookies.push(`session_id=${faker.string.alphanumeric(24)}`);
  
  // 随机添加一些常见的cookie
  if (faker.datatype.boolean()) {
    cookies.push(`user_id=${faker.string.alphanumeric(16)}`);
  }
  if (faker.datatype.boolean()) {
    cookies.push(`lang=${faker.helpers.arrayElement(['zh-CN', 'en-US', 'ja-JP'])}`);
  }
  if (faker.datatype.boolean()) {
    cookies.push(`theme=${faker.helpers.arrayElement(['light', 'dark', 'auto'])}`);
  }
  
  return cookies.join('; ');
}

// 生成真实的请求头
function generateRealisticHeaders(options = {}) {
  const { mobile = false, platform = null } = options;
  
  // 生成符合条件的User-Agent
  const userAgent = new UserAgent({ deviceCategory: mobile ? 'mobile' : 'desktop' });
  const ua = userAgent.toString();
  
  // 从User-Agent中提取浏览器信息
  const isChrome = ua.includes('Chrome');
  const isSafari = ua.includes('Safari') && !isChrome;
  const isFirefox = ua.includes('Firefox');
  
  // 动态生成浏览器版本信息
  let secChUa = '';
  if (isChrome) {
    const chromeVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '120';
    secChUa = `"Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}", "Not.A/Brand";v="99"`;
  } else if (isSafari) {
    secChUa = '"Safari";v="16", "Not.A/Brand";v="99"';
  } else if (isFirefox) {
    secChUa = '"Firefox";v="122"';
  }
  
  // 检测平台
  let detectedPlatform = platform;
  if (!detectedPlatform) {
    if (ua.includes('Windows')) detectedPlatform = 'Windows';
    else if (ua.includes('Macintosh')) detectedPlatform = 'macOS';
    else if (ua.includes('Linux')) detectedPlatform = 'Linux';
    else if (ua.includes('Android')) detectedPlatform = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) detectedPlatform = 'iOS';
  }
  
  const headers = {
    'User-Agent': ua,
    'Accept': faker.helpers.arrayElement([
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    ]),
    'Accept-Language': faker.helpers.arrayElement([
      'zh-CN,zh;q=0.9,en;q=0.8',
      'zh-CN,zh;q=0.9',
      'en-US,en;q=0.9',
      'ja-JP,ja;q=0.9,en;q=0.8',
      'ko-KR,ko;q=0.9,en;q=0.8'
    ]),
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': faker.helpers.arrayElement(commonReferers),
    'Connection': 'keep-alive',
    'Cache-Control': faker.helpers.arrayElement(['max-age=0', 'no-cache']),
    'Upgrade-Insecure-Requests': '1',
  };
  
  // 添加安全相关的头部（Chrome/Edge特有）
  if (isChrome) {
    headers['Sec-CH-UA'] = secChUa;
    headers['Sec-CH-UA-Mobile'] = mobile ? '?1' : '?0';
    headers['Sec-CH-UA-Platform'] = `"${detectedPlatform}"`;
    headers['Sec-Fetch-Site'] = faker.helpers.arrayElement(['none', 'same-origin', 'cross-site']);
    headers['Sec-Fetch-Mode'] = faker.helpers.arrayElement(['navigate', 'cors', 'no-cors']);
    headers['Sec-Fetch-User'] = '?1';
    headers['Sec-Fetch-Dest'] = faker.helpers.arrayElement(['document', 'empty', 'image']);
  }
  
  // 随机添加一些可选的头部
  if (faker.datatype.boolean(0.7)) {
    headers['DNT'] = '1';
  }
  
  if (faker.datatype.boolean(0.5)) {
    headers['X-Forwarded-For'] = generateRandomIp();
  }
  
  if (faker.datatype.boolean(0.3)) {
    headers['X-Real-IP'] = generateRandomIp();
  }
  
  if (faker.datatype.boolean(0.6)) {
    headers['Cookie'] = generateCookie();
  }
  
  return headers;
}

// 为特定平台生成请求头
function generatePlatformHeaders(platform) {
  const platformConfigs = {
    xiaohongshu: {
      mobile: true,
      customHeaders: {
        'X-Xhs-Common': faker.string.alphanumeric(32),
      }
    },
    douyin: {
      mobile: true,
      customHeaders: {
        'X-Bogus': faker.string.alphanumeric(28),
      }
    },
    weibo: {
      mobile: false,
      customHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
      }
    },
    wechat: {
      mobile: true,
      customHeaders: {
        'X-Wechat-Version': faker.helpers.arrayElement(['8.0.32', '8.0.33', '8.0.34']),
      }
    }
  };
  
  const config = platformConfigs[platform] || { mobile: false };
  const headers = generateRealisticHeaders({ mobile: config.mobile });
  
  // 添加平台特定的请求头
  if (config.customHeaders) {
    Object.assign(headers, config.customHeaders);
  }
  
  // 设置平台特定的Referer
  if (platform === 'xiaohongshu') {
    headers['Referer'] = 'https://www.xiaohongshu.com/';
  } else if (platform === 'douyin') {
    headers['Referer'] = 'https://www.douyin.com/';
  } else if (platform === 'weibo') {
    headers['Referer'] = 'https://weibo.com/';
  } else if (platform === 'wechat') {
    headers['Referer'] = 'https://mp.weixin.qq.com/';
  }
  
  return headers;
}

module.exports = {
  generateRealisticHeaders,
  generatePlatformHeaders,
  generateRandomIp,
  generateCookie
};