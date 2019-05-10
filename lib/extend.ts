import Application from 'koa';
import { HttpException, Success, Exception } from './exception';
import consola from 'consola';
import { toLine, unsets } from './util';
import { get, set } from 'lodash';

/**
 * json序列化扩展
 *
 * ```js
 * ctx.json({ msg:"hello from lin!" })
 * ```
 *
 * @param app app实例
 */
export const json = (app: Application) => {
  /**
   * hide 表示想要隐藏的属性
   */
  app.context.json = function(obj: any, hide = []) {
    this.type = 'application/json';
    unsets(obj, hide);
    let data = Object.create(null);
    if (obj instanceof HttpException) {
      transform(obj, data);
      set(data, 'url', this.request.url);
      this.status = obj.code;
    } else {
      data = obj;
    }
    this.body = JSON.stringify(data);
  };
};

function transform(obj: any, data: any) {
  const fields: string[] = get(obj, 'fields', []);
  fields.forEach(field => {
    data[toLine(field)] = get(obj, field);
  });
}

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
      error_code: suc.errorCode,
      msg: suc.msg,
      url: this.req.url
    };
    this.status = suc.code;
    this.body = JSON.stringify(data);
  };
};

/**
 * 日志扩展
 *
 * ```js
 * ctx.logger.info();
 * ctx.logger.warn();
 * ctx.logger.debug();
 * ctx.logger.error();
 * ```
 *
 * @param app app实例
 */
export const logging = (app: Application) => {
  app.context.logger = consola;
};
