/**
 * 辅助工具函数
 */
const config = require('./config');

/**
 * 从文本中提取URL
 * @param {string} text 包含URL的文本
 * @returns {string|null} 提取的URL或null
 */
function findUrl(text) {
  if (!text || typeof text !== 'string') return null;
  
  // URL正则表达式
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g;
  const matches = text.match(urlRegex);
  
  return matches ? matches[0] : null;
}

/**
 * 识别平台类型
 * @param {string} text 包含URL的文本
 * @returns {string|null} 平台类型或null
 */
function identifyPlatform(text) {
  if (!text || typeof text !== 'string') return null;
  
  const lowerText = text.toLowerCase();
  
  // 检查域名匹配
  for (const [platform, domains] of Object.entries(config.PLATFORM_DOMAINS)) {
    if (domains.some(domain => lowerText.includes(domain))) {
      return platform;
    }
  }
  
  // 检查关键词匹配
  for (const [platform, keywords] of Object.entries(config.APP_TYPE_KEYWORD)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return platform;
    }
  }
  
  return null;
}

/**
 * 延迟函数
 * @param {number} ms 延迟毫秒数
 * @returns {Promise} Promise对象
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 * @param {Function} fn 要重试的函数
 * @param {number} maxRetries 最大重试次数
 * @param {number} delayMs 重试间隔
 * @returns {Promise} Promise对象
 */
async function retry(fn, maxRetries = config.MAX_RETRIES, delayMs = 1000) {
  let lastError;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries) {
        console.log(`重试 ${i + 1}/${maxRetries}: ${error.message}`);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * 清理URL参数
 * @param {string} url 原始URL
 * @returns {string} 清理后的URL
 */
function cleanUrl(url) {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // 移除一些常见的跟踪参数
    const paramsToRemove = ['utm_source', 'utm_medium', 'utm_campaign', 'spm', 'from'];
    paramsToRemove.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * 验证图片格式
 * @param {string} format 图片格式
 * @returns {boolean} 是否支持
 */
function isSupportedImageFormat(format) {
  return config.SUPPORTED_IMAGE_FORMATS.includes(format?.toLowerCase());
}

/**
 * 生成随机字符串
 * @param {number} length 长度
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = {
  findUrl,
  identifyPlatform,
  delay,
  retry,
  cleanUrl,
  isSupportedImageFormat,
  generateRandomString
};