import isAsyncFunction from "is-async-function";
import { get, isArray, unset, cloneDeep } from "lodash";
import { ParametersException } from "./exception";
import { Context } from "koa";
import validator1 from "validator";
import { extendedValidator } from "./extended-validator";
import { getAllMethodNames, getAllFieldNames } from "./util";

/**
 * 强大的校验器
 * 支持optional，支持array，支持nested object
 */
export class LinValidator {
  /**
   * 装载数据的容器
   */
  data: any = {};

  /**
   * 解析后的数据容器
   */
  parsed: any = {};

  /**
   * 数据校验错误容器
   */
  errors: any[] = [];

  /**
   * 别名
   */
  alias: any;

  /**
   * 校验
   * @param ctx koa context
   * @param alias 别名
   */
  async validate(ctx: Context, alias?: {}) {
    this.alias = alias;
    this.data = {
      body: ctx.request.body,
      query: ctx.request.query,
      path: ctx.params,
      header: ctx.request.header
    };
    const tmpData = cloneDeep(this.data);
    this.parsed = {
      ...tmpData,
      default: {}
    };
    if (!(await this.checkRules())) {
      let obj = {};
      if (this.errors.length === 1) {
        obj = this.errors[0].message;
      } else {
        for (const err of this.errors) {
          obj[err.key] = err.message;
        }
      }
      throw new ParametersException({ msg: obj });
    } else {
      ctx.v = this;
      return this;
    }
  }

  private replace(keys: string[]) {
    // key 是原来的名字
    if (!this.alias) {
      return keys;
    }
    let arr: string[] = [];
    for (let key of keys) {
      if (this.alias[key]) {
        this[this.alias[key]] = this[key];
        unset(this, key);
        arr.push(this.alias[key]);
      } else {
        arr.push(key);
      }
    }
    return arr;
  }

  private isOptional(val: any) {
    // undefined , null , ""  , "    ", 皆通过
    if (val === void 0) {
      return true;
    }
    if (val === null) {
      return true;
    }
    if (typeof val === "string") {
      return val === "" || val.trim() === "";
    }
    return false;
  }

  private async checkRules() {
    // 筛选出是Rule或Rules的key
    // 添加规则校验 validateKey
    // default校验规则 throw
    let keys = getAllFieldNames(this, {
      filter: key => {
        const value = this[key];
        if (isArray(value)) {
          if (value.length === 0) {
            return false;
          }
          for (const it of value) {
            if (!(it instanceof Rule)) {
              throw new Error("every item must be a instance of Rule");
            }
          }
          return true;
        } else {
          return value instanceof Rule;
        }
      }
    });
    // 此处进行别名替换
    keys = this.replace(keys);
    for (const key of keys) {
      // 标志位
      let stoppedFlag = false;
      let optional = false;
      const value = this[key];
      let defaultVal;
      // 如果没有传入这个参数，检查这个校验链中是否有 isOptional 如果有通过，否则抛异常
      // 去data下找key，二级目录查找 dataKey 为一级目录的路径
      const [dataKey, dataVal] = this.findInData(key);
      if (this.isOptional(dataVal)) {
        let msg: string | undefined;
        if (isArray(value)) {
          for (const it of value) {
            if (it.optional) {
              defaultVal = it.defaultValue && it.defaultValue;
              optional = true;
            } else {
              if (!msg) {
                msg = it.message;
              }
            }
          }
        } else {
          if (value.optional) {
            defaultVal = value.defaultValue && value.defaultValue;
            optional = true;
          } else {
            msg = value.message;
          }
        }
        // 没有 isOptional 抛异常
        // 有 isOptional 取它的默认值
        if (!optional) {
          this.errors.push({ key, message: msg || `${key}不可为空` });
        } else {
          this.parsed["default"][key] = defaultVal;
        }
      } else {
        if (isArray(value)) {
          const errs: String[] = [];
          for (const it of value) {
            // 当rule的optional为false时，进行校验
            if (!stoppedFlag && !it.optional) {
              let valid: boolean;
              if (isAsyncFunction(it.validate)) {
                valid = await it.validate(this.data[dataKey][key]);
              } else {
                valid = it.validate(this.data[dataKey][key]);
              }
              if (!valid) {
                errs.push(it.message);
                // 如果当前key已有错误，则置stoppedFlag为true，后续会直接跳过校验
                stoppedFlag = true;
              }
            }
            if (it.parsedValue !== void 0) {
              this.parsed[dataKey][key] = it.parsedValue;
            }
          }
          if (errs.length !== 0) {
            this.errors.push({ key, message: errs });
          }
        } else {
          const errs: String[] = [];
          if (!stoppedFlag && !value.optional) {
            let valid: boolean;
            if (isAsyncFunction(value.validate)) {
              valid = await value.validate(this.data[dataKey][key]);
            } else {
              valid = value.validate(this.data[dataKey][key]);
            }
            if (!valid) {
              errs.push(value.message);
              // 如果当前key已有错误，则置stoppedFlag为true，后续会直接跳过校验
              stoppedFlag = true;
            }
          }
          if (value.parsedValue !== void 0) {
            this.parsed[dataKey][key] = value.parsedValue;
          }
          if (errs.length !== 0) {
            this.errors.push({ key, message: errs });
          }
        }
      }
    }
    let validateFuncKeys: string[] = getAllMethodNames(this, {
      filter: key =>
        /validate([A-Z])\w+/g.test(key) && typeof this[key] === "function"
    });

    for (const validateFuncKey of validateFuncKeys) {
      //  最后校验规则函数
      const customerValidateFunc = get(this, validateFuncKey);
      // 自定义校验函数，第一个参数是校验是否成功，第二个参数为错误信息
      let validRes: boolean;
      if (isAsyncFunction(customerValidateFunc)) {
        validRes = await customerValidateFunc.call(this);
      } else {
        validRes = customerValidateFunc.call(this);
      }
      if (isArray(validRes) && !validRes[0]) {
        let key;
        if (validRes[2]) {
          key = validRes[2];
        } else {
          key = validateFuncKey.replace("validate", "").toLowerCase();
        }
        this.errors.push({ key, message: validRes[1] });
      } else if (!validRes) {
        let key = validateFuncKey.replace("validate", "").toLowerCase();
        // 如果自定函数没有给出错误信息，那么错误信息为默认
        this.errors.push({ key, message: "参数错误" });
      }
    }
    return this.errors.length === 0;
  }

  /**
   *  取参数里的值；如果参数不能被解析，则返回没有被解析的值
   * @param path 参数所在的路径，如 a.b
   * @param parsed 是否取已经解析后的数据，默认为true
   * @param defaultVal 默认值，当路径指向的值不存在，取默认值
   */
  get(path: string, parsed = true) {
    let defaultVal;
    if (arguments.length >= 3) {
      defaultVal = arguments[2];
    }
    if (parsed) {
      const key = get(this.parsed, path, defaultVal && defaultVal);
      if (!this.isOptional(key)) {
        return key;
      } else {
        const index = path.lastIndexOf(".");
        const suffix = path.substring(index + 1, path.length);
        return get(this.parsed["default"], suffix, defaultVal && defaultVal);
      }
    } else {
      return get(this.data, path, defaultVal && defaultVal);
    }
  }

  private findInData(key: string) {
    const keys = Object.keys(this.data);
    for (const k of keys) {
      const val = get(this.data[k], key);
      if (val !== void 0) {
        return [k, val];
      }
    }
    return [];
  }
}

/**
 * 规则类
 */
export class Rule {
  options: any;
  message: string;
  validateFunction: string | Function;
  optional: boolean = false;
  parsedValue: any;
  rawValue: any;
  defaultValue: any;
  constructor(
    validateFunction: string | Function,
    message?: string,
    ...options
  ) {
    this.validateFunction = validateFunction;
    this.message = message || "参数错误";
    this.options = options;
    if (this.validateFunction === "isOptional") {
      // 如果当前项为optional，检查该项是否存在，若不存在，将optional置为true
      // 如果是optional，那么没有传入的参数，可以使用默认值
      this.optional = true;
      this.defaultValue = options && options[0];
    }
  }

  validate(value: any) {
    this.rawValue = value;
    if (typeof this.validateFunction === "function") {
      return this.validateFunction(value, ...this.options);
    } else {
      switch (this.validateFunction) {
        case "isInt":
          if (typeof value === "string") {
            this.parsedValue = validator1.toInt(value);
            return validator1.isInt(value, ...this.options);
          } else {
            this.parsedValue = value;
            return validator1.isInt(String(value), ...this.options);
          }
        case "isFloat":
          if (typeof value === "string") {
            this.parsedValue = validator1.toFloat(value);
            return validator1.isFloat(value, ...this.options);
          } else {
            this.parsedValue = value;
            return validator1.isFloat(String(value), ...this.options);
          }
        case "isBoolean":
          if (typeof value === "string") {
            this.parsedValue = validator1.toBoolean(value);
            return validator1.isBoolean(value);
          } else {
            this.parsedValue = value;
            return validator1.isBoolean(String(value));
          }
        case "isNotEmpty":
          return extendedValidator.isNotEmpty(value);
        default:
          return validator1[this.validateFunction](value, ...this.options);
      }
    }
  }
}
