import * as path from 'path';
import { merge, get, has, set } from 'lodash';
import Application from 'koa';

/**
 * Config类的实现
 * 帮助应用从文件中读取配置，目前仅支持从js文件中读取配置
 *
 * ```js
 * const config = new Config();
 * config.getConfigFromFile("path/file");
 * ```
 *
 * 当然也支持从object对象中获取配置
 * ```js
 * config.getConfigFromObj({...});
 * ```
 *
 * 获取配置项
 * ```js
 * config.getItem("key");
 * ```
 */
export class Config {
  /**
   * 存储配置的容器
   */
  private store: Object = {};

  /**
   * 将当前的config实例挂载到koa app的context上
   *
   * @param app koa app实例
   */
  public initApp(app: Application) {
    app.context.config = this;
  }

  /**
   * 获取单个的配置项
   * ```js
   * const val = config.getItem("key");
   * ```
   *
   * 支持传入默认值，如果不存在该配置项，则返回传入的默认值
   *
   * ```js
   * const val = config.getItem("key","default");
   * // 如果config中存在key的配置项，则返回其配置项
   * // 否则返回 "default"
   * ```
   *
   * @param key 配置项的路径
   * @param defaultVal 可选参数，默认值
   */
  public getItem(key: string, defaultVal?: any) {
    return get(this.store, key, defaultVal);
  }

  /**
   * 检查是否存在某个配置项
   *
   * ```js
   * const exit = config.hasItem("key");
   * // 如果存在 exit 为true
   * // 不存在，则exit 为false
   * ```
   * @param key 配置项的路径
   */
  public hasItem(key: string) {
    return has(this.store, key);
  }

  /**
   * 通过硬编码的方式设置配置项
   *
   * ```js
   * config.setItem("name","pedro");
   * // 设置 name 配置项的值为 pedro
   * // 如果config中已存在这个配置项，则覆盖原有的
   * ```
   * @param key 配置项的键
   * @param val 配置项的值
   */
  public setItem(key: string, val: any) {
    set(this.store, key, val);
  }

  /**
   * 从js文件中导入配置
   *
   * ```js
   * config.getConfigFromFile("path/file");
   * ```
   * @param filepath js文件的路径，相对当前工作目录的路径
   */
  public getConfigFromFile(filepath: string) {
    const baseDir = process.cwd();
    const mod = require(path.resolve(baseDir, filepath));
    // const conf = get(mod, "default");
    this.store = merge(this.store, mod);
  }

  /**
   * 从object对象中导入配置
   *
   * ```js
   * config.getConfigFromObj({...});
   * ```
   * @param obj 配置对象 ，如 {}
   */
  public getConfigFromObj(obj: any) {
    this.store = merge(this.store, obj);
  }
}

/**
 * 全局的config实例
 */
export const config = new Config();
