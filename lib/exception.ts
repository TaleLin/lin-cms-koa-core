import assert from "assert";
import { isInteger } from "lodash";

export interface Exception {
  code?: number;
  msg?: any;
  errorCode?: number;
}

export class HttpException extends Error {
  public code: number = 500; // http 状态码
  public msg: any = "服务器未知错误"; // 返回的信息内容
  public errorCode: number = 999; // 特定的错误码

  public fields: string[] = ["msg", "errorCode"];

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

export class Success extends HttpException {
  public code = 201;
  public msg = "成功";
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

export class Failed extends HttpException {
  public code = 400;
  public msg = "失败";
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

export class AuthFailed extends HttpException {
  public code = 401;
  public msg = "认证失败";
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

export class NotFound extends HttpException {
  public code = 404;
  public msg = "资源不存在";
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

// msg必须每次指定，js没有默认的赋值操作，父类的构造函数在字段赋值之前。
export class ParametersException extends HttpException {
  public code = 400;
  public msg = "参数错误";
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

export class InvalidTokenException extends HttpException {
  public code = 401;
  public msg = "令牌失效";
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

export class ExpiredTokenException extends HttpException {
  public code = 422;
  public msg = "令牌过期";
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

export class UnknownException extends HttpException {
  public code = 400;
  public msg = "服务器未知错误";
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

export class RepeatException extends HttpException {
  public code = 400;
  public msg = "字段重复";
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

export class Forbidden extends HttpException {
  public code = 401;
  public msg = "不可操作";
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

export class MethodNotAllowed extends HttpException {
  public code = 405;
  public msg = "请求方法不允许";
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
