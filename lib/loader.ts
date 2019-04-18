import { assert, getFiles } from "./util";
import { get, set } from "lodash";
import Application from "koa";
import Router from "koa-router";
import consola from "consola";
import path from "path";
import { Model } from "sequelize";
import { Plugin } from "./plugin";
import { config } from "./config";
import { disableLoading } from "./core";

/**
 * loader of lin
 * working for loading plugins
 */
export class Loader {
  public mainRouter: Router | undefined;
  public pluginPath: {};
  private app: Application;
  public plugins = {};
  constructor(pluginPath: {}, app: Application) {
    assert(!!pluginPath, "pluginPath must not be empty");
    this.pluginPath = pluginPath;
    this.app = app;
    this.loadMainApi(app);
    this.loadPlugins();
  }

  /**
   * 加载插件
   */
  public loadPlugins() {
    Object.keys(this.pluginPath).forEach(item => {
      // item is name of plugin
      if (get(this.pluginPath, `${item}.enable`)) {
        const path1 = get(this.pluginPath, `${item}.path`);
        const baseDir = process.cwd();
        let confPath = "";
        const scriptType = config.getItem("scriptType", "js");
        const prod = process.env.NODE_ENV === "production";
        if (prod || scriptType !== "ts") {
          confPath = path.resolve(baseDir, path1, "config.js");
        } else {
          confPath = path.resolve(baseDir, path1, "config.ts");
        }
        const appPath = path.resolve(baseDir, path1, "app");
        const incomingConf = get(this.pluginPath, item);
        this.loadConfig(item, confPath, incomingConf);
        this.loadPlugin(item, appPath);
      }
    });
  }

  /**
   * loadPlugin 加载单个插件
   */
  public loadPlugin(name: string, path: string) {
    const mod = require(path);
    // const exports = get(mod, "default");
    const plugin = new Plugin(name);
    Object.keys(mod).forEach(key => {
      if (mod[key] instanceof Router) {
        plugin.addController(key, mod[key]);
      } else if (Model.isPrototypeOf(mod[key])) {
        // 如果导出的模型继承自Model
        plugin.addModel(key, mod[key]);
      }
    });
    this.plugins[name] = plugin;
  }

  /**
   * loadConfig 加载插件配置
   */
  public loadConfig(name: string, path: string, incomingConf: {}) {
    const mod = require(path);
    // const conf = get(mod, "default");
    const newConf = {};
    set(newConf, name, { ...mod, ...incomingConf });
    this.app.context.config.getConfigFromObj(newConf);
  }

  /**
   * 加载主应用中的所有路由
   */
  public loadMainApi(app: Application) {
    const mainRouter = new Router();
    this.mainRouter = mainRouter;
    // 默认api的文件夹
    let apiDir = config.getItem("apiDir", "app/api");
    apiDir = `${process.cwd()}/${apiDir}`;
    const files = getFiles(apiDir);
    for (const file of files) {
      const extention = file.substring(file.lastIndexOf("."), file.length);
      // 现在只考虑加载.js文件，后续考虑.ts文件
      if (extention === ".js") {
        const mod = require(file);
        // const exports = get(mod, "default");
        // 如果disableLoading为true，则不加载这个文件路由
        // tslint:disable-next-line:no-empty
        if (!mod[disableLoading]) {
          Object.keys(mod).forEach(key => {
            if (mod[key] instanceof Router) {
              consola.info(`loading a router instance :${key} from file: ${file}`);
              get(mod[key] , "stack", []).forEach(ly => {
                consola.info(`loading a route: ${get(ly, "path")}`);
              });
              mainRouter
                .use(mod[key].routes())
                .use(mod[key].allowedMethods());
            }
          });
        }
      }
    }
    app.use(mainRouter.routes()).use(mainRouter.allowedMethods());
  }
}