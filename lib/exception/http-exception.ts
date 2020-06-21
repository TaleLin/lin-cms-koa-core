import assert from 'assert';
import { isInteger, isFunction } from 'lodash';
import { Exception, CodeMessage } from '../types'
import { config } from '../config'

const CodeMessage = config.getItem('codeMessage', {}) as CodeMessage

if (CodeMessage && !isFunction(CodeMessage.getMessage)) {
  throw new Error('CodeMessage.getMessage() must be implemented')
}

/**
 * HttpException 是lin中所有其他异常的基类
 *
 * ```js
 * // 实例化一个默认的HttpException
 * const ex = new HttpException();
 *
 * // 实例化一个带参的HttpException
 * // 如果只传 code 会通过 CodeMessage.getMessage(code) 方法获取 message
 * const ex = new HttpException({ code: 10010 });
 *
 * // 也可以是其他参数
 * const ex = new HttpException({ message: CodeMessage.getMessage(10010) });
 *
 * // 也可以指定所有参数
 * const ex = new HttpException({ code: 10010, message: CodeMessage.getMessage(10010) });
 * 
 * // 也可以只穿一个 code 作为参数
 * // 如果只传 code 会通过 CodeMessage.getMessage(code) 方法获取 message
 * const ex = new HttpException(10010)
 * ```
 */
export class HttpException extends Error {
  /**
   * http 状态码
   */
  public status: number = 500;

  /**
   * 返回的信息内容
   */
  public message = CodeMessage.getMessage(9999);

  /**
   * 特定的错误码
   */
  public code: number = 9999;

  public fields: string[] = ['message', 'code'];

  /**
   * 构造函数
   * @param ex 可选参数，通过{}的形式传入 / 也可以直接传 code
   */
  constructor(ex?: Exception | number) {
    super();
    this.exceptionHandler(ex);
  }

  protected exceptionHandler(ex?: Exception | number) {
    // 可以直接传一个 code
    if (isInteger(ex)) {
      this.code = ex as number
      this.message = CodeMessage.getMessage(ex as number)
      return
    }
    
    if (ex && (ex as Exception).code) {
      assert(isInteger((ex as Exception).code));
      const code = (ex as Exception).code as number 
      this.code = code;
      this.message = CodeMessage.getMessage(code)
    }
    if (ex && (ex as Exception).message) {
      this.message = (ex as Exception).message as string;
    }
  }
}
/**
 * 成功
 */
export class Success extends HttpException {
  public status = 201;
  public message = CodeMessage.getMessage(0);
  public code = 0;

  constructor(ex?: number | Exception) {
    super();
    this.exceptionHandler(ex);
  }
}
/**
 * 失败
 */
export class Failed extends HttpException {
  public status = 400;
  public message = CodeMessage.getMessage(9999);
  public code = 9999;

  constructor(ex?: Exception | number) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 认证失败
 */
export class AuthFailed extends HttpException {
  public status = 401;
  public message = CodeMessage.getMessage(10000);
  public code = 10000;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 资源不存在
 */
export class NotFound extends HttpException {
  public status = 404;
  public message = CodeMessage.getMessage(10020);
  public code = 10020;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 参数错误
 */
export class ParametersException extends HttpException {
  public status = 400;
  public message = CodeMessage.getMessage(10030);
  public code = 10030;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 令牌失效或损坏
 */
export class InvalidTokenException extends HttpException {
  public status = 401;
  public message = CodeMessage.getMessage(10040);
  public code = 10040;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 令牌过期
 */
export class ExpiredTokenException extends HttpException {
  public status = 422;
  public message = CodeMessage.getMessage(10050);
  public code = 10050;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 服务器未知错误
 */
export class UnknownException extends HttpException {
  public status = 400;
  public message = CodeMessage.getMessage(9999);
  public code = 9999;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 字段重复
 */
export class RepeatException extends HttpException {
  public status = 400;
  public message = CodeMessage.getMessage(10060);
  public code = 10060;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 禁止操作
 */
export class Forbidden extends HttpException {
  public status = 403;
  public message = CodeMessage.getMessage(10070);
  public code = 10070;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 请求方法不允许
 */
export class MethodNotAllowed extends HttpException {
  public status = 405;
  public message = CodeMessage.getMessage(10080);
  public code = 10080;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * refresh token 获取失败
 */
export class RefreshException extends HttpException {
  public status = 401;
  public message = CodeMessage.getMessage(10100);
  public code = 10100;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 文件体积过大
 */
export class FileTooLargeException extends HttpException {
  public status = 413;
  public message = CodeMessage.getMessage(10110);
  public code = 10110;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 文件数量过多
 */
export class FileTooManyException extends HttpException {
  public status = 413;
  public message = CodeMessage.getMessage(10120);
  public code = 10120;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 文件扩展名不符合规范
 */
export class FileExtensionException extends HttpException {
  public status = 406;
  public message = CodeMessage.getMessage(10130);
  public code = 10130;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}

/**
 * 请求过于频繁，请稍后重试
 */
export class LimitException extends HttpException {
  public status = 401;
  public message = CodeMessage.getMessage(10140);
  public code = 10140;

  constructor(ex ? : Exception) {
    super();
    this.exceptionHandler(ex);
  }
}
