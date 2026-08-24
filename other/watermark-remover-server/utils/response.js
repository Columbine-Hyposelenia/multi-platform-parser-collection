/**
 * 统一响应格式处理
 */
class Response {
  /**
   * 成功响应
   * @param {any} data 响应数据
   * @param {string} message 消息
   * @returns {Object} 格式化的响应对象
   */
  static success(data, message = '操作成功') {
    return {
      code: 0,
      message,
      data,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 错误响应
   * @param {string} message 错误消息
   * @param {number} code 错误码
   * @returns {Object} 格式化的错误响应对象
   */
  static error(message = '操作失败', code = -1) {
    return {
      code,
      message,
      data: null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 参数验证错误
   * @param {string} message 错误消息
   * @returns {Object} 格式化的错误响应对象
   */
  static validationError(message = '参数验证失败') {
    return this.error(message, -2);
  }

  /**
   * 服务器错误
   * @param {string} message 错误消息
   * @returns {Object} 格式化的错误响应对象
   */
  static serverError(message = '服务器内部错误') {
    return this.error(message, -500);
  }
}

module.exports = Response;