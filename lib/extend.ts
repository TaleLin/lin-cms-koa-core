import Application from "koa";
import { HttpException } from "./exception";
import consola from "consola";
import { toLine, unsets } from "./util";
import { get, set } from "lodash";

/**
 * 将返回的结果json序列化
 * @param app app实例
 */
export const json = (app: Application) => {
  /**
   * hide 表示想要隐藏的属性
   */
  app.context.json = function(obj: any, hide = []) {
    this.type = "application/json";
    unsets(obj, hide);
    let data = Object.create(null);
    if (obj instanceof HttpException) {
      transform(obj, data);
      set(data, "url", this.request.url);
      this.status = obj.code;
    } else {
      data = obj;
    }
    this.body = JSON.stringify(data);
  };
};

function transform(obj: any, data: any) {
  const fields: string[] = get(obj, "fields", []);
  fields.forEach(field => {
    data[toLine(field)] = get(obj, field);
  });
}

/**
 * logging扩展
 * @param app app实例
 */
export const logging = (app: Application) => {
  app.context.logger = consola;
};
