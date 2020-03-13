import Application from 'koa';
import { Success } from "../exception";
import { Exception } from "../types";

/**
 * 处理success
 *
 * ```js
 * ctx.success({ msg:"hello from lin!" })
 * ```
 *
 * ```js
 * ctx.success({ code: 200, msg: "hello from lin!", errorCode: 10000 })
 * ```
 *
 * @param app app实例
 */
export const success = (app: Application) => {
  app.context.success = function(ex?: Exception) {
    this.type = 'application/json';
    const suc = new Success(ex);
    let data = {
      code: suc.errorCode,
      message: suc.msg,
      request: `${this.method} ${this.req.url}`
    };
    this.status = suc.code;
    this.body = JSON.stringify(data);
  };
};