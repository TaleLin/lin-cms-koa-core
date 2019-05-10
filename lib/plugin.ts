import { set, get } from 'lodash';

/**
 * 插件类，一个插件包含自己的业务 (router)，自己的模型 (model)
 * 自己的校验层，视图层
 */
export class Plugin {
  /**
   * 插件名称
   */
  public name: string;

  /**
   * 模型容器
   */
  public models = {};

  /**
   * 控制器容器
   */
  public controllers = {};

  constructor(name: string) {
    this.name = name;
  }

  /**
   * 添加一个模型
   * @param name 模型名
   * @param model 模型
   */
  public addModel(name: string, model: any) {
    set(this.models, name, model);
  }

  /**
   * 获得模型
   * @param name 模型名
   */
  public getModel(name: string) {
    return get(this.models, name);
  }

  /**
   * 添加一个控制器
   * @param name 控制器名
   * @param controller 控制器
   */
  public addController(name: string, controller: any) {
    set(this.controllers, name, controller);
  }
}
