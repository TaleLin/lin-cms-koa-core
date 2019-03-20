import Application from "koa";
import { HttpException } from "./exception";
import consola from "consola";
import { toLine, unsets } from "./util";
import { JsonMixin } from "./mixin";
import { get, remove, findIndex, isArray, isObject, isMap, set } from "lodash";

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
      transform1(obj, data);
      set(data, "url", this.request.url);
      this.status = obj.code;
    } else {
      // data = jsonUnmarshal(obj);
      // data = transform2(obj);
      data = obj;
    }
    this.body = JSON.stringify(data);
  };
};

function jsonUnmarshal(obj: any) {
  let data = Object.create(null);
  if (isObject(obj)) {
    if (obj instanceof JsonMixin) {
      transform1(obj, data);
    } else if (isMap(obj)) {
      obj.forEach((v, k) => {
        if (isObject(v)) {
          data[toLine(k)] = jsonUnmarshal(v);
        } else {
          data[toLine(k)] = v;
        }
      });
    } else if (isArray(obj)) {
      obj.forEach(v => {
        if (isObject(v)) {
          v = jsonUnmarshal(v);
        }
      });
    } else {
      Object.keys(obj).forEach(key => {
        if (isObject(obj[key])) {
          data[toLine(key)] = jsonUnmarshal(obj[key]);
        } else {
          data[toLine(key)] = obj[key];
        }
      });
    }
  } else {
    data = obj;
  }
  return data;
}

function transform2(obj: any) {
  let data;
  if (isArray(obj)) {
    data = [];
    obj.forEach((it, index) => {
      data[index] = transform2(it);
    });
  } else {
    data = Object.create(null);
    const fields: string[] = Object.keys(obj);
    fields.forEach(field => {
      data[toLine(field)] = get(obj, field);
    });
  }
  return data;
}

function transform1(obj: any, data: any) {
  const fields: string[] = get(obj, "fields", []);
  fields.forEach(field => {
    data[toLine(field)] = get(obj, field);
  });
}

function transform(obj: any, hide: Array<any>, data: any) {
  const fields: string[] = get(obj, "fields", []);
  if (isArray(hide) && hide.length > 0) {
    remove(fields, item => {
      return findIndex(hide, item as any) !== -1;
    });
  }
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
