import { Validator as BaseValidator } from "class-validator";
import { has, get } from "lodash";
import validator1 from "validator";

// options for IsFloat
interface IsFloatOptions {
  min?: number;
  max?: number;
  gt?: number;
  lt?: number;
}

// options for IsInt
interface IsIntOptions {
  min?: number;
  max?: number;
  allow_leading_zeroes?: boolean;
  lt?: number;
  gt?: number;
}

export class ExtendedValidator extends BaseValidator {
  /**
   * 检查一个object是否具有某个属性
   * @param obj
   * @param path
   * @example
   * hasProperty({a:"l"},"a")
   */
  hasProperty(obj: any, path: string) {
    return has(obj, path);
  }

  /**
   * 检查一个object的某个属性是否为空
   * @param obj
   * @param path
   * @example
   * objPropertyIsNotEmpty({ a : { b: "c" }, "a.b" })
   */
  objPropertyIsNotEmpty(obj: any, path: string) {
    if (!this.hasProperty(obj, path)) {
      return false;
    }
    return this.isNotEmpty(get(obj, path));
  }

  /**
   * 检查一个object的多个属性是否为空
   * @param obj
   * @param paths
   * @example
   * objPropertiesIsNotEmpty({a: {b:"c", d: "e"}}, ["a.b","a.d"])
   */
  objPropertiesIsNotEmpty(obj: any, paths: string[]) {
    for (const path of paths) {
      if (!this.hasProperty(obj, path)) {
        return false;
      }
      if (!this.isNotEmpty(get(obj, path))) {
        return false;
      }
    }
    return true;
  }

  toInt(input: string, radix?: number) {
    return validator1.toInt(input, radix);
  }

  toFloat(input: string) {
    return validator1.toFloat(input);
  }

  toBoolean(input: string) {
    return validator1.toBoolean(input);
  }

  toDate(input: string) {
    return validator1.toDate(input);
  }

  isFloat(str: string, options?: IsFloatOptions) {
    return validator1.isFloat(str, options);
  }

  isFloat2(input: number, options?: IsFloatOptions) {
    return validator1.isFloat(input + "", options);
  }

  isInt2(str: string, options?: IsIntOptions) {
    return validator1.isInt(str, options);
  }

  isInt3(input: number, options?: IsIntOptions) {
    return validator1.isInt(input + "", options);
  }
}

export const extendedValidator = new ExtendedValidator();
