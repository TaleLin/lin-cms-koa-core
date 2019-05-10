import assert from 'assert';
import { isInteger } from 'lodash';

/**
 * HttpException 类构造函数的参数接口
 */
export interface Exception {
  code?: number;
  msg?: any;
  errorCode?: number;
}

/**
 * HttpException 是lin中所有其他异常的基类
 *
 * ```js
 * // 实例化一个默认的HttpException
 * const ex = new HttpException();
 *
 * // 实例化一个带参的HttpException
 * const ex = new HttpException({ msg: "想给你一个信息呢！" });
 *
 * // 也可以是其他参数
 * const ex = new HttpException({ errorCode: 10010 });
 *
 * // 也可以指定所有参数
 * const ex = new HttpException({ errorCode: 10010, msg: "想给你一个信息呢！", code: 200 });
 * ```
 */
export class HttpException extends Error {
  /**
   * http 状态码
   */
  public code: number = 500;

  /**
   * 返回的信息内容
   */
  public msg: any = '服务器未知错误';

  /**
   * 特定的错误码
   */
  public errorCode: number = 999;

  public fields: string[] = ['msg', 'errorCode'];

  /**
   * 构造函数
   * @param ex 可选参数，通过{}的形式传入
   */
  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 成功
 */
export class Success extends HttpException {
  public code = 201;
  public msg = '成功';
  public errorCode = 0;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 失败
 */
export class Failed extends HttpException {
  public code = 400;
  public msg = '失败';
  public errorCode = 9999;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 认证失败
 */
export class AuthFailed extends HttpException {
  public code = 401;
  public msg = '认证失败';
  public errorCode = 10000;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 资源不存在
 */
export class NotFound extends HttpException {
  public code = 404;
  public msg = '资源不存在';
  public errorCode = 10020;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 参数错误
 */
export class ParametersException extends HttpException {
  public code = 400;
  public msg = '参数错误';
  public errorCode = 10030;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 令牌失效或损坏
 */
export class InvalidTokenException extends HttpException {
  public code = 401;
  public msg = '令牌失效';
  public errorCode = 10040;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 令牌过期
 */
export class ExpiredTokenException extends HttpException {
  public code = 422;
  public msg = '令牌过期';
  public errorCode = 10050;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 服务器未知错误
 */
export class UnknownException extends HttpException {
  public code = 400;
  public msg = '服务器未知错误';
  public errorCode = 999;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 字段重复
 */
export class RepeatException extends HttpException {
  public code = 400;
  public msg = '字段重复';
  public errorCode = 10060;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 不可操作
 */
export class Forbidden extends HttpException {
  public code = 401;
  public msg = '不可操作';
  public errorCode = 10070;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * 请求方法不允许
 */
export class MethodNotAllowed extends HttpException {
  public code = 405;
  public msg = '请求方法不允许';
  public errorCode = 10080;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}

/**
 * refresh token 获取失败
 */
export class RefreshException extends HttpException {
  public code = 401;
  public msg = 'refresh token 获取失败';
  public errorCode = 10100;

  constructor(ex?: Exception) {
    super();
    if (ex && ex.code) {
      assert(isInteger(ex.code));
      this.code = ex.code;
    }
    if (ex && ex.msg) {
      this.msg = ex.msg;
    }
    if (ex && ex.errorCode) {
      assert(isInteger(ex.errorCode));
      this.errorCode = ex.errorCode;
    }
  }
}
