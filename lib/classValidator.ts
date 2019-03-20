import isAsyncFunction from "is-async-function";
import { get, isArray, set, unset } from "lodash";
import { ParametersException } from "./exception";
import { Context } from "koa";
import { extendedValidator } from "./extendedValidator";
import { getAllMethodNames } from "./util";

/**
 * 支持optional，支持array，支持nested object
 */
export class ClassValidator {
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

  async validate(ctx: Context, alias?: {}) {
    this.alias = alias;
    const params = Object.assign(
      {},
      ctx.request.body,
      ctx.request.query,
      ctx.params,
      ctx.request.header
    );
    for (const it of Object.keys(params)) {
      set(this.data, it, get(params, it));
    }
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
      // 把validator挂载到ctx上
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

  private async checkRules() {
    // 筛选出是Rule或Rules的key
    // 添加规则校验 validateKey
    // default校验规则 throw
    let keys = Object.keys(this).filter(key => {
      const value = this[key];
      if (isArray(value)) {
        return value[0] instanceof Rule;
      } else {
        return value instanceof Rule;
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
      if (extendedValidator.isEmpty(this.data[key])) {
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
          this.data[key] = defaultVal;
        }
      } else {
        if (isArray(value)) {
          const errs: String[] = [];
          for (const it of value) {
            // 当rule的optional为false时，进行校验
            if (!stoppedFlag && !it.optional) {
              let valid: boolean;
              if (isAsyncFunction(it.validate)) {
                valid = await it.validate(this.data[key]);
              } else {
                valid = it.validate(this.data[key]);
              }
              if (!valid) {
                errs.push(it.message);
                // 如果当前key已有错误，则置stoppedFlag为true，后续会直接跳过校验
                stoppedFlag = true;
              }
            }
            it.parsedValue && (this.parsed[key] = it.parsedValue);
          }
          if (errs.length !== 0) {
            this.errors.push({ key, message: errs });
          }
        } else {
          const errs: String[] = [];
          if (!stoppedFlag && !value.optional) {
            let valid: boolean;
            if (isAsyncFunction(value.validate)) {
              valid = await value.validate(this.data[key]);
            } else {
              valid = value.validate(this.data[key]);
            }
            if (!valid) {
              errs.push(value.message);
              // 如果当前key已有错误，则置stoppedFlag为true，后续会直接跳过校验
              stoppedFlag = true;
            }
          }
          value.parsedValue && (this.parsed[key] = value.parsedValue);
          if (errs.length !== 0) {
            this.errors.push({ key, message: errs });
          }
        }
      }
    }
    let validateFuncKeys: string[] = getAllMethodNames(this).filter(key => {
      return /validate([A-Z])\w+/g.test(key) && typeof this[key] === "function";
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
      }
    }
    return this.errors.length === 0;
  }

  get(path: string, parsed = false) {
    let defaultVal;
    if (arguments.length >= 3) {
      defaultVal = arguments[2];
    }
    if (parsed) {
      return get(this.parsed, path, defaultVal && defaultVal);
    } else {
      return get(this.data, path, defaultVal && defaultVal);
    }
  }
}

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
      if (this.validateFunction === "isDate") {
        typeof value === "string"
          ? (this.parsedValue = extendedValidator.toDate(value))
          : (this.parsedValue = value);
      } else if (this.validateFunction === "isInt") {
        if (typeof value === "string") {
          this.parsedValue = extendedValidator.toInt(value);
          return extendedValidator.isInt2(value, ...this.options);
        } else {
          this.parsedValue = value;
          return extendedValidator.isInt3(value, ...this.options);
        }
      } else if (this.validateFunction === "isFloat") {
        if (typeof value === "string") {
          this.parsedValue = extendedValidator.toFloat(value);
          return extendedValidator.isFloat(value, ...this.options);
        } else {
          this.parsedValue = value;
          return extendedValidator.isFloat2(value, ...this.options);
        }
      } else if (this.validateFunction === "isBoolean") {
        typeof value === "string"
          ? (this.parsedValue = extendedValidator.toBoolean(value))
          : (this.parsedValue = value);
        return extendedValidator.isBoolean(value);
      }
      return extendedValidator[this.validateFunction](value, ...this.options);
    }
  }
}
