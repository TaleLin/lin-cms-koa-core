import { IRouterContext } from "koa-router";
import fs from "fs";
import { routeMetaInfo } from "./core";
import { get, unset } from "lodash";
import { config } from "./config";
import { ParametersException } from "./exception";
import { __decorate, __metadata } from "tslib";

export const isUndefined = (obj: any): obj is undefined =>
  typeof obj === "undefined";

export const isFunction = (fn: any): boolean => typeof fn === "function";

export const isObject = (fn: any): fn is object =>
  !isNil(fn) && typeof fn === "object";

export const isString = (fn: any): fn is string => typeof fn === "string";

export const isConstructor = (fn: string): boolean => fn === "constructor";

export const validatePath = (path?: string): string =>
  path ? (path.charAt(0) !== "/" ? "/" + path : path) : "";

// tslint:disable-next-line: strict-type-predicates
export const isNil = (obj: null): boolean => isUndefined(obj) || obj === null;

export const isEmpty = (array: { length: number }): boolean =>
  !(array && array.length > 0);

export const isSymbol = (fn: any): fn is symbol => typeof fn === "symbol";

/**
 * Assertion utility.
 */
export function assert(ok: boolean, ...args: string[]): void {
  if (!ok) {
    throw new Error(args.join(" "));
  }
}

// 下划线转换驼峰
export function toHump(name: string) {
  return name.replace(/\_(\w)/g, (_, letter) => {
    return letter.toUpperCase();
  });
}

// 驼峰转换下划线
export function toLine(name: string) {
  return name.replace(/([A-Z])/g, "_$1").toLowerCase();
}

/**
 * 通过当前的路由名找到对应的权限录入信息
 * @param ctx koa 的 context
 */
export function findAuthAndModule(ctx: IRouterContext) {
  const routeName = ctx._matchedRouteName || ctx.routerName;
  const endpoint = `${ctx.method} ${routeName}`;
  return routeMetaInfo.get(endpoint);
}

export function findMetaByAuth(auth: any) {
  const dests = Array.from(routeMetaInfo.values());
  for (let i = 0; i < dests.length; i++) {
    const el = dests[i];
    if (el["auth"] === auth) {
      return el;
    }
  }
  return null;
}

/**
 * 检查日期的格式为 "YYYY-MM-DD HH:mm:ss"
 * @param time input time
 */
export function checkDateFormat(time: string) {
  if (!time || time === "") {
    return true;
  }
  const r = time.match(
    /^(\d{4})(-|\/)(\d{2})\2(\d{2}) (\d{2}):(\d{2}):(\d{2})$/
  );
  if (r === null) return false;
  const d = new Date(
    parseInt(r[1], 10),
    parseInt(r[3], 10) - 1,
    parseInt(r[4], 10),
    parseInt(r[5], 10),
    parseInt(r[6], 10),
    parseInt(r[7], 10)
  );
  return (
    d.getFullYear() === parseInt(r[1], 10) &&
    d.getMonth() + 1 === parseInt(r[3], 10) &&
    d.getDate() === parseInt(r[4], 10) &&
    d.getHours() === parseInt(r[5], 10) &&
    d.getMinutes() === parseInt(r[6], 10) &&
    d.getSeconds() === parseInt(r[7], 10)
  );
}

export function paginate(ctx: IRouterContext) {
  let count =
    get(ctx.request.query, "count") || config.getItem("countDefault", 10);
  let start =
    get(ctx.request.query, "page") || config.getItem("pageDefault", 0);
  count = parseInt(count >= 15 ? 15 : count, 10);
  start = parseInt(start, 10) * count;
  if (start < 0 || count < 0) {
    throw new ParametersException({ msg: "请输入正确的分页参数" });
  }
  return { start, count };
}

export function unsets(obj: any, props: Array<string>) {
  props.forEach(prop => {
    unset(obj, prop);
  });
}

/**
 *  在js中使用装饰器语法的语法糖函数
 * @param {*} decorators 装饰器
 * @param {*} type 被装饰值的类型 String | Array
 * @param {*} target 被装饰类的原型
 * @param {*} key 被装饰器类的键
 *
 * ```js
 * tslib.__decorate([
 * Length(2, 20, {
 *  message: "昵称长度必须在2~10之间"
 * }),
 * IsNotEmpty({
 *  message: "昵称不可为空"
 * }),
 * tslib.__metadata("design:type", String)
 * ] , RegisterForm.prototype, "nickname", void 0);
 * // 可被转化为
 * decorate(
 * [Length(2, 20, {
 *  message: "昵称长度必须在2~10之间"
 * }),
 *  IsNotEmpty({
 *  message: "昵称不可为空"
 * })],
 * String,
 * RegisterForm.prototype,
 * "nickname"
 * )
 * ```
 */
export function decorateProp(decorators, type, target, key) {
  return __decorate(
    [...decorators, __metadata("design:type", type)],
    target,
    key
  );
}

export interface ObjOptions {
  prefix?: string;
  filter?: (key: any) => boolean;
}

/**
 * 获取一个实例的所有方法
 * @param obj 对象实例
 * @param option 参数
 *
 * ```js
 *     let validateFuncKeys: string[] = getAllMethodNames(this, {
 *     filter: key =>
 *   /validate([A-Z])\w+/g.test(key) && typeof this[key] === "function"
 *  });
 * ```
 */
export function getAllMethodNames(obj, option?: ObjOptions) {
  let methods = new Set();
  // tslint:disable-next-line:no-conditional-assignment
  while ((obj = Reflect.getPrototypeOf(obj))) {
    let keys = Reflect.ownKeys(obj);
    keys.forEach(k => methods.add(k));
  }
  let keys = Array.from(methods.values());
  return prefixAndFilter(keys, option);
}

/**
 * 获得实例的所有字段名
 * @param obj 实例
 * @param option 参数项
 *
 * ```js
 *     let keys = getAllFieldNames(this, {
 *      filter: key => {
 *    const value = this[key];
 *    if (isArray(value)) {
 *      if (value.length === 0) {
 *      return false;
 *    }
 *    for (const it of value) {
 *       if (!(it instanceof Rule)) {
 *         throw new Error("every item must be a instance of Rule");
 *      }
 *    }
 *    return true;
 *   } else {
 *    return value instanceof Rule;
 *    }
 *   }
 *  });
 * ```
 */
export function getAllFieldNames(obj, option?: ObjOptions) {
  let keys = Reflect.ownKeys(obj);
  return prefixAndFilter(keys, option);
}

function prefixAndFilter(keys: any[], option?: ObjOptions) {
  option &&
    option.prefix &&
    (keys = keys.filter(key => key.toString().startsWith(option.prefix)));
  option && option.filter && (keys = keys.filter(option.filter));
  return keys;
}

/**
 * 获取文件夹下所有文件名
 * @param dir 文件夹
 */
export function getFiles(dir: string) {
  let res: string[] = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = dir + "/" + file;
    if (fs.statSync(name).isDirectory()) {
      const tmp = getFiles(name);
      res = res.concat(tmp);
    } else {
      res.push(name);
    }
  }
  return res;
}
