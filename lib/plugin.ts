import { set, get } from "lodash";
/**
 * 插件类，一个插件包含自己的业务 (router)，自己的模型 (model)
 * 自己的校验层，视图层
 */
export class Plugin {
  public name: string;
  public models = {};
  public controllers = {};

  constructor(name: string) {
    this.name = name;
  }

  /**
   * addModel
   */
  public addModel(name: string, model: any) {
    set(this.models, name, model);
  }

  /**
   * getModel
   */
  public getModel(name: string) {
    return get(this.models, name);
  }

  /**
   * addController
   */
  public addController(name: string, controller: any) {
    set(this.controllers, name, controller);
  }
}
