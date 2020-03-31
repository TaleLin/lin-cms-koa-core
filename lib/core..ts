import Application from 'koa';
import consola from 'consola';
import { IMiddleware } from 'koa-router';
import { assert } from './utils';
import { LinRouter } from './router';
import { set, get } from 'lodash';
import { config } from './config';

// tslint:disable-next-line:variable-name
export const __version__ = '0.3.2';

// 存放meta路由信息
export const routeMetaInfo = new Map();

// 当前文件路由是否挂载
export const disableLoading = Symbol('disableLoading');

/**
 * Lin核心类
 */
export class Lin {
  private app: Application | undefined;


  /**
   * 初始化
   *
   * @param app koa app
   * @param mount 是否挂载路由
   */
  public async initApp(
    app: Application,
    mount?: boolean, // 是否挂载插件路由，默认为true
  ) {
    this.app = app;
    this.app!.context.config = config;
    assert(!!this.app, 'app must not be null');
    // 挂载默认路由
    mount && this.mount();
  }
  
  private mount() {
    const pluginRp = new LinRouter({ prefix: '/plugin' });
    Object.values(this.app!.context.plugins).forEach(plugin => {
      consola.info(`loading plugin: ${get(plugin, 'name')}`);
      const controllers: any[] = Object.values(get(plugin, 'controllers'));
      if (controllers.length > 1) {
        controllers.forEach(cont => {
          set(
            cont,
            'opts.prefix',
            `/${get(plugin, 'name')}${get(cont, 'opts.prefix')}`
          );
          get(cont, 'stack', []).forEach(ly => {
            if (config.getItem('debug')) {
              consola.info(
                `loading a route: /plugin/${get(plugin, 'name')}${get(
                  ly,
                  'path'
                )}`
              );
            }
            set(ly, 'path', `/${get(plugin, 'name')}${get(ly, 'path')}`);
          });
          pluginRp
            .use(cont.routes() as IMiddleware)
            .use(cont.allowedMethods() as IMiddleware);
        });
      } else {
        controllers.forEach(cont => {
          if (config.getItem('debug')) {
            get(cont, 'stack', []).forEach(ly => {
              consola.info(`loading a route: /plugin${get(ly, 'path')}`);
            });
          }
          pluginRp
            .use(cont.routes() as IMiddleware)
            .use(cont.allowedMethods() as IMiddleware);
        });
      }
    });
    this.app!.use(pluginRp.routes()).use(pluginRp.allowedMethods());
  }
}
