import Application from 'koa';
import { toLine, unsets } from '../utils';
import { HttpException } from '../exception';
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