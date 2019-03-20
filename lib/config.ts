import * as path from "path";
import { merge, get, has, set } from "lodash";
import Application from "koa";

/**
 * 挂载到app的context上，你可以通过 ctx.config使用
 * 配置实例也独立于app应用，这样才可在全局使用配置
 * 否则每次都要拿到app或者ctx才能访问配置
 *
 * @export
 * @class Config
 */
export class Config {
  /**
   * 存储所有配置信息
   *
   * @private
   * @type {Object}
   * @memberof Config
   */
  private store: Object = {};

  public initApp(app: Application) {
    app.context.config = this;
  }

  /**
   * getItem
   */
  public getItem(key: string, defaultVal?: any) {
    return get(this.store, key, defaultVal);
  }

  /**
   * hasItem
   */
  public hasItem(key: string) {
    return has(this.store, key);
  }

  /**
   * setItem
   */
  public setItem(key: string, val: any) {
    set(this.store, key, val);
  }

  /**
   * import导入是异步导入
   * require导入是同步导入
   * getConfigFromFile 选择同步导入配置文件
   */
  public getConfigFromFile(filepath: string) {
    const baseDir = process.cwd();
    const mod = require(path.resolve(baseDir, filepath));
    // const conf = get(mod, "default");
    this.store = merge(this.store, mod);
  }

  /**
   * getConfigFromObj
   */
  public getConfigFromObj(obj: any) {
    this.store = merge(this.store, obj);
  }
}

/**
 * 全局的config实例
 */
export const config = new Config();
