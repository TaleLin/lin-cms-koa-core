import Application from 'koa';
import { Success } from "../exception";
import { Exception, CodeMessage } from "../types";
import { config } from '../config'

const CodeMessage = config.getItem('codeMessage', {}) as CodeMessage

/**
 * 处理 success
 *
 * ```js
 * ctx.success({ message: "hello from lin!" })
 * ```
 *
 * ```js
 * ctx.success({ message: "hello from lin!", code: 0 })
 * ```
 *
 * @param app app实例
 */
export const success = (app: Application) => {
  app.context.success = function(ex?: Exception) {
    this.type = 'application/json';
    const success = new Success(ex);
    let data = {
      code: success.code,
      message: success.message,
      request: `${this.method} ${this.req.url}`
    };
    this.status = success.status;
    this.body = JSON.stringify(data);
  };
};